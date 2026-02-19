#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Telegram voice memo transcription bot.

Send a voice memo to the bot, get a summary + full transcript file back.
Send text to chat with the AI assistant.
Send any other file and it gets stored for you.

All files are stored locally under data/{bot_name}/... and optionally
synced to S3 with the exact same path structure.

Usage:
    uv run telegram_bot.py
"""

import os
import sys
import io
import json
import logging
import datetime
from pathlib import Path

import boto3
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Unified local storage root — mirrors S3 key structure exactly
DATA_DIR = Path(__file__).parent / "data"

# Short transcripts are sent inline, long ones get summary + file
INLINE_CHAR_LIMIT = 2000

# Per-user conversation history (in-memory, resets on restart)
_chat_histories: dict[int, list[dict]] = {}
MAX_HISTORY = 20


def _get_openai_client():
    """Get OpenAI-compatible client if API key is configured."""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return None
    from openai import OpenAI
    base_url = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')
    return OpenAI(api_key=api_key, base_url=base_url)


def _get_s3_client():
    """Get S3 client if bucket is configured."""
    bucket = os.getenv('S3_BUCKET')
    if not bucket:
        return None, None
    region = os.getenv('AWS_REGION', 'us-east-1')
    s3 = boto3.client('s3', region_name=region)
    return s3, bucket


def _ensure_claude_config():
    """Create minimal Claude config files if they don't exist.

    The Claude Code CLI expects ~/.claude.json and ~/.claude/ to exist.
    Without them it logs warnings and may fail.
    """
    config_file = Path.home() / ".claude.json"
    if not config_file.exists():
        config_file.write_text("{}")
        logger.info(f"Created minimal {config_file}")

    claude_dir = Path.home() / ".claude"
    claude_dir.mkdir(exist_ok=True)


async def _analyze_with_file_agent(question: str, bot_name: str, s3_client=None, s3_bucket: str | None = None) -> str | None:
    """Run Claude Agent SDK pointed at GLM to autonomously analyze stored files.

    The agent gets Read, Glob, Grep tools and is pointed at the data/ directory.
    GLM's Anthropic-compatible endpoint is configured via the env parameter
    on ClaudeAgentOptions (passed directly to the CLI subprocess).
    """
    glm_key = os.getenv('GLM_API_KEY')
    if not glm_key:
        return None

    from claude_agent_sdk import (
        query, ClaudeAgentOptions,
        AssistantMessage, SystemMessage, ResultMessage, UserMessage,
        TextBlock, ToolUseBlock, ToolResultBlock,
        ProcessError,
    )

    _ensure_claude_config()

    bot_data_dir = DATA_DIR / bot_name
    bot_data_dir.mkdir(parents=True, exist_ok=True)
    data_path = str(bot_data_dir.resolve())

    # Build env dict for the CLI subprocess.
    # Set both ANTHROPIC_AUTH_TOKEN (Bearer) and ANTHROPIC_API_KEY (x-api-key)
    # to maximise compatibility across CLI versions.
    agent_env = {
        "ANTHROPIC_BASE_URL": os.getenv('ANTHROPIC_BASE_URL', "https://api.z.ai/api/anthropic"),
        "ANTHROPIC_AUTH_TOKEN": glm_key,
        "ANTHROPIC_API_KEY": glm_key,
        "API_TIMEOUT_MS": "120000",
    }
    glm_model = os.getenv('GLM_MODEL')
    if glm_model:
        agent_env["ANTHROPIC_DEFAULT_SONNET_MODEL"] = glm_model

    # Also inject into current process env so the subprocess inherits them
    for k, v in agent_env.items():
        os.environ[k] = v

    logger.info(f"Agent env: BASE_URL={agent_env['ANTHROPIC_BASE_URL']}, "
                f"MODEL={glm_model}, apiKeySource={'ANTHROPIC_API_KEY+AUTH_TOKEN'}")

    options = ClaudeAgentOptions(
        system_prompt=(
            "You are a file analysis assistant. The user is asking about their stored files "
            "(meeting transcripts, voice memo transcriptions, uploaded documents). "
            "Browse the current directory to discover files, read the relevant ones, "
            "and answer the user's question. Be concise and helpful. Use markdown formatting."
        ),
        allowed_tools=["Read", "Glob", "Grep"],
        cwd=data_path,
        max_turns=10,
        env=agent_env,
    )

    try:
        result_parts = []
        async for message in query(prompt=question, options=options):
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        logger.info(f"Agent text: {block.text[:200]}")
                        result_parts.append(block.text)
                    elif isinstance(block, ToolUseBlock):
                        logger.info(f"Agent tool call: {block.name}({getattr(block, 'input', '')})")
                    elif isinstance(block, ToolResultBlock):
                        content = str(getattr(block, 'content', ''))[:200]
                        logger.info(f"Agent tool result: {content}")
            elif isinstance(message, SystemMessage):
                logger.info(f"Agent system: {message}")
            elif isinstance(message, ResultMessage):
                logger.info(f"Agent result: {message}")
            else:
                logger.info(f"Agent message ({type(message).__name__}): {str(message)[:200]}")

        return "\n".join(result_parts) if result_parts else None

    except ProcessError as e:
        logger.error(f"Claude Agent SDK process failed (exit code {e.exit_code}): {e}")
        if hasattr(e, 'stderr'):
            logger.error(f"Agent stderr: {e.stderr}")
        if hasattr(e, 'stdout'):
            logger.error(f"Agent stdout: {e.stdout}")
        return None
    except Exception as e:
        logger.error(f"Claude Agent SDK (GLM) failed: {type(e).__name__}: {e}")
        return None

    finally:
        # Persist Claude Agent session history to S3
        if s3_client and s3_bucket:
            try:
                _sync_claude_history_to_s3(s3_client, s3_bucket)
            except Exception as e:
                logger.error(f"Failed to sync Claude history to S3: {e}")


# Tool definition for OpenAI function calling (intent detection)
_CHAT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_stored_files",
            "description": (
                "Search and analyze the user's stored files (transcripts, meeting notes, uploaded documents). "
                "Call this when the user asks about their past meetings, transcripts, uploaded files, "
                "or wants to find/analyze/summarize content from stored files. "
                "Examples: 'what did we discuss yesterday?', 'find my transcript from Monday', "
                "'summarize all meetings this week', 'what files have I uploaded?'"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "The user's question about their stored files"
                    }
                },
                "required": ["question"]
            }
        }
    }
]


CLAUDE_DIR = Path.home() / ".claude"


def _sync_s3_prefix_to_local(s3_client, bucket: str, prefix: str, local_dir: Path):
    """Download all S3 objects under prefix to local_dir, skipping same-size files."""
    local_dir.mkdir(parents=True, exist_ok=True)
    paginator = s3_client.get_paginator('list_objects_v2')
    count = 0
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get('Contents', []):
            key = obj['Key']
            # Strip prefix to get relative path
            rel = key[len(prefix):].lstrip('/')
            if not rel:
                continue
            local_path = local_dir / rel
            if local_path.exists() and local_path.stat().st_size == obj['Size']:
                continue
            local_path.parent.mkdir(parents=True, exist_ok=True)
            s3_client.download_file(bucket, key, str(local_path))
            count += 1
    return count


def _sync_local_to_s3_prefix(s3_client, bucket: str, prefix: str, local_dir: Path):
    """Upload all files under local_dir to S3 under prefix, skipping same-size files."""
    if not local_dir.exists():
        return 0
    # Build a set of existing S3 objects for size comparison
    existing = {}
    paginator = s3_client.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get('Contents', []):
            existing[obj['Key']] = obj['Size']

    count = 0
    for f in local_dir.rglob("*"):
        if not f.is_file():
            continue
        rel = str(f.relative_to(local_dir))
        key = f"{prefix}{rel}"
        if key in existing and existing[key] == f.stat().st_size:
            continue
        s3_client.upload_file(str(f), bucket, key)
        count += 1
    return count


def _sync_from_s3(s3_client, bucket: str, bot_name: str):
    """On startup, sync bot data + Claude Agent session history from S3."""
    # Sync bot data files
    logger.info(f"Syncing bot data from s3://{bucket}/{bot_name}/ ...")
    count = _sync_s3_prefix_to_local(s3_client, bucket, f"{bot_name}/", DATA_DIR / bot_name)
    logger.info(f"Bot data sync: {count} files downloaded")

    # Sync Claude Agent SDK session history
    logger.info(f"Syncing Claude Agent history from s3://{bucket}/.claude/ ...")
    count = _sync_s3_prefix_to_local(s3_client, bucket, ".claude/", CLAUDE_DIR)
    logger.info(f"Claude Agent history sync: {count} files downloaded")


def _sync_claude_history_to_s3(s3_client, bucket: str):
    """After an agent call, persist Claude session history back to S3."""
    count = _sync_local_to_s3_prefix(s3_client, bucket, ".claude/", CLAUDE_DIR)
    if count:
        logger.info(f"Synced {count} Claude Agent history files to S3")



def _storage_prefix(bot_name: str, username: str, timestamp: str) -> str:
    """Build the relative path prefix used for both local and S3 storage.

    Returns e.g.: transcribe-bot/2026/02/19/143022_Alice
    """
    now = datetime.datetime.now()
    return f"{bot_name}/{now.strftime('%Y/%m/%d')}/{timestamp}_{username}"


def _save_file(s3_client, s3_bucket: str | None, prefix: str, filename: str, data: bytes | str):
    """Save a file locally under data/{prefix}/{filename} and optionally to S3."""
    body = data.encode('utf-8') if isinstance(data, str) else data

    # Always save locally
    local_path = DATA_DIR / prefix / filename
    local_path.parent.mkdir(parents=True, exist_ok=True)
    local_path.write_bytes(body)
    logger.info(f"Saved locally: {local_path}")

    # Also upload to S3 if configured
    if s3_client and s3_bucket:
        key = f"{prefix}/{filename}"
        s3_client.put_object(Bucket=s3_bucket, Key=key, Body=body)
        logger.info(f"Uploaded to s3://{s3_bucket}/{key}")

    return str(local_path)


def _summarize(transcript_text: str) -> str | None:
    """Summarize a transcript using OpenAI-compatible API. Returns None if unavailable."""
    client = _get_openai_client()
    if not client:
        return None

    model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": (
                    "You are a meeting notes assistant. Summarize the transcript below. "
                    "Output format:\n"
                    "1. A 2-3 sentence summary of what was discussed.\n"
                    "2. Key decisions made (if any).\n"
                    "3. Action items with owners (if identifiable).\n\n"
                    "Be concise. Use bullet points. Do not include timestamps."
                )},
                {"role": "user", "content": transcript_text}
            ],
            max_tokens=1024,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        return None


async def _chat(user_id: int, message: str, bot_name: str, s3_client=None, s3_bucket: str | None = None) -> str | None:
    """Chat with AI. Uses OpenAI tool calling to detect file analysis intent.

    Normal chat → OpenAI-compatible endpoint responds directly.
    File analysis → OpenAI detects intent via tool call → GLM Claude agent analyzes files.
    """
    client = _get_openai_client()
    if not client:
        return None

    model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')

    if user_id not in _chat_histories:
        _chat_histories[user_id] = []
    history = _chat_histories[user_id]

    history.append({"role": "user", "content": message})

    if len(history) > MAX_HISTORY:
        history[:] = history[-MAX_HISTORY:]

    try:
        messages = [
            {"role": "system", "content": (
                "You are a helpful assistant integrated into a Telegram bot. "
                "You help with meeting notes, transcription questions, and general tasks. "
                "Be concise and conversational. Use markdown formatting when helpful. "
                "When the user asks about their stored files, transcripts, or past meetings, "
                "use the search_stored_files tool to look up and analyze their data."
            )},
            *history
        ]

        # First call — may return a tool call or a direct response
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=_CHAT_TOOLS,
            max_tokens=1024,
        )

        choice = response.choices[0]

        # Direct response — no tool call, normal chat
        if choice.finish_reason != "tool_calls" or not choice.message.tool_calls:
            reply = choice.message.content
            history.append({"role": "assistant", "content": reply})
            return reply

        # Tool call detected — delegate to GLM Claude file agent
        tool_call = choice.message.tool_calls[0]
        args = json.loads(tool_call.function.arguments)
        question = args.get("question", message)

        logger.info(f"Intent: file analysis → delegating to GLM Claude agent (question={question!r})")

        # Spawn GLM Claude agent with file tools
        analysis = await _analyze_with_file_agent(question, bot_name, s3_client=s3_client, s3_bucket=s3_bucket)

        if analysis:
            reply = analysis
        else:
            reply = "Sorry, I couldn't analyze your files right now. Please try again."

        history.append({"role": "assistant", "content": reply})
        return reply

    except Exception as e:
        logger.error(f"Chat failed: {e}")
        history.pop()
        return None


def main():
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN not set in .env")
        sys.exit(1)

    if not os.getenv('ASSEMBLY_API_KEY'):
        logger.error("ASSEMBLY_API_KEY not set in .env")
        sys.exit(1)

    import assemblyai as aai
    aai.settings.api_key = os.getenv('ASSEMBLY_API_KEY')

    from telegram import Update
    from telegram.ext import Application, CommandHandler, MessageHandler, filters

    from src.transcription import transcribe_video, create_text_transcript

    # Ensure storage root exists
    DATA_DIR.mkdir(exist_ok=True)

    s3_client, s3_bucket = _get_s3_client()
    bot_name = os.getenv('BOT_NAME', 'transcribe-bot')

    ai_enabled = bool(_get_openai_client())
    if ai_enabled:
        logger.info("AI enabled (OPENAI_API_KEY configured) — chat + summarization active")
    else:
        logger.info("AI disabled (no OPENAI_API_KEY). Chat and summarization unavailable.")

    if os.getenv('GLM_API_KEY'):
        logger.info("GLM Claude Agent enabled — file analysis via Claude Agent SDK + GLM backend")
    else:
        logger.info("GLM Claude Agent disabled (no GLM_API_KEY). File Q&A unavailable.")

    if s3_client:
        logger.info(f"S3 storage enabled (bucket: {s3_bucket}) — local + S3 sync")
        _sync_from_s3(s3_client, s3_bucket, bot_name)
    else:
        logger.info("S3 storage disabled (no S3_BUCKET). Saving files locally only.")

    logger.info(f"Local storage: {DATA_DIR.resolve()}/{bot_name}/")

    async def start(update: Update, context):
        features = [
            "Send me a *voice memo* or *audio/video file* — I'll transcribe it with speaker labels.",
        ]
        if ai_enabled:
            features.append("Send me *text* — I'll chat with you as an AI assistant.")
        features.append("Send me *any other file* — I'll store it for you.")

        await update.message.reply_text(
            "\n".join(features) + "\n\nSpeaker diarization and auto language detection included.",
            parse_mode="Markdown"
        )

    async def _transcribe_and_reply(msg, file, ext):
        """Common transcription logic for voice/audio/video messages and documents."""
        user = msg.from_user
        username = user.first_name or str(user.id)
        timestamp = datetime.datetime.now().strftime("%H%M%S")
        prefix = _storage_prefix(bot_name, username, timestamp)

        processing_msg = await msg.reply_text("Transcribing... this may take a minute.")

        # Download audio to the unified storage location
        audio_filename = f"audio{ext}"
        local_audio = DATA_DIR / prefix / audio_filename
        local_audio.parent.mkdir(parents=True, exist_ok=True)
        await file.download_to_drive(str(local_audio))
        logger.info(f"Downloaded audio to {local_audio}")

        try:
            segments = transcribe_video(str(local_audio))

            if not segments:
                await processing_msg.edit_text("Sorry, I couldn't transcribe that audio. It might be too short or unclear.")
                return

            transcript_text = _format_transcript(segments)

            # Save audio + transcript (audio already on disk, just sync to S3)
            with open(local_audio, 'rb') as f:
                audio_bytes = f.read()
            _save_file(s3_client, s3_bucket, prefix, audio_filename, audio_bytes)
            _save_file(s3_client, s3_bucket, prefix, "transcript.txt", transcript_text)

            # Reply
            if len(transcript_text) <= INLINE_CHAR_LIMIT:
                await processing_msg.edit_text(transcript_text, parse_mode="Markdown")
            else:
                await processing_msg.edit_text("Transcription done. Generating summary...")

                summary = _summarize(transcript_text)

                if summary:
                    reply_text = f"*Summary:*\n\n{summary}"
                else:
                    preview = transcript_text[:1500] + "\n\n_(full transcript attached as file)_"
                    reply_text = preview

                await processing_msg.edit_text(reply_text, parse_mode="Markdown")

                transcript_filename = f"{datetime.datetime.now().strftime('%Y-%m-%d')}_{timestamp}_{username}.txt"
                file_bytes = io.BytesIO(transcript_text.encode('utf-8'))
                file_bytes.name = transcript_filename
                await msg.reply_document(
                    document=file_bytes,
                    filename=transcript_filename,
                    caption="Full transcript with speaker labels and timestamps."
                )

            logger.info(f"Sent transcript to {username} ({len(segments)} segments)")

        except Exception as e:
            logger.error(f"Transcription failed for {username}: {e}", exc_info=True)
            await processing_msg.edit_text(f"Sorry, transcription failed. Please try again.\nError: {str(e)[:200]}")

    async def handle_voice(update: Update, context):
        """Handle voice notes, audio files, and video files → transcribe."""
        msg = update.message
        user = msg.from_user
        logger.info(f"Received voice memo from {user.first_name} ({user.id})")

        if msg.voice:
            file = await msg.voice.get_file()
            ext = ".ogg"
        elif msg.audio:
            file = await msg.audio.get_file()
            ext = _mime_to_ext(msg.audio.mime_type or "audio/ogg")
        elif msg.video:
            file = await msg.video.get_file()
            ext = ".mp4"
        elif msg.video_note:
            file = await msg.video_note.get_file()
            ext = ".mp4"
        else:
            return

        await _transcribe_and_reply(msg, file, ext)

    async def handle_text(update: Update, context):
        """Handle text messages → AI chat."""
        msg = update.message
        user = msg.from_user
        text = msg.text.strip()

        if not text:
            return

        logger.info(f"Chat from {user.first_name} ({user.id}): {text[:80]}...")

        if not ai_enabled:
            await msg.reply_text(
                "AI chat is not configured. Send me a voice memo or audio file to transcribe!"
            )
            return

        reply = await _chat(user.id, text, bot_name, s3_client=s3_client, s3_bucket=s3_bucket)
        if reply:
            await msg.reply_text(reply, parse_mode="Markdown")
        else:
            await msg.reply_text("Sorry, I couldn't process that. Please try again.")

    async def handle_document(update: Update, context):
        """Handle document uploads — route audio/video to transcription, store everything else."""
        msg = update.message
        user = msg.from_user
        doc = msg.document

        if not doc:
            return

        mime = doc.mime_type or ""

        # Audio/video documents → transcribe
        if mime.startswith("audio/") or mime.startswith("video/"):
            logger.info(f"Received audio/video document from {user.first_name} ({user.id})")
            file = await doc.get_file()
            ext = _mime_to_ext(mime) if mime.startswith("audio/") else ".mp4"
            await _transcribe_and_reply(msg, file, ext)
            return

        # All other documents → store
        logger.info(f"Received file from {user.first_name}: {doc.file_name} ({mime})")

        processing_msg = await msg.reply_text("Saving your file...")

        try:
            file = await doc.get_file()
            filename = doc.file_name or f"file_{msg.message_id}"
            username = user.first_name or str(user.id)
            timestamp = datetime.datetime.now().strftime("%H%M%S")
            prefix = _storage_prefix(bot_name, username, timestamp)

            file_data = await file.download_as_bytearray()
            _save_file(s3_client, s3_bucket, prefix, filename, bytes(file_data))

            await processing_msg.edit_text(f"Saved: `{filename}`", parse_mode="Markdown")

        except Exception as e:
            logger.error(f"File save failed for {user.first_name}: {e}", exc_info=True)
            await processing_msg.edit_text(f"Sorry, couldn't save the file.\nError: {str(e)[:200]}")

    def _mime_to_ext(mime_type: str) -> str:
        mapping = {
            "audio/ogg": ".ogg",
            "audio/mpeg": ".mp3",
            "audio/mp4": ".m4a",
            "audio/aac": ".aac",
            "audio/wav": ".wav",
            "audio/x-wav": ".wav",
            "audio/opus": ".ogg",
            "video/mp4": ".mp4",
            "video/quicktime": ".mov",
        }
        return mapping.get(mime_type.split(";")[0].strip(), ".ogg")

    def _format_transcript(segments) -> str:
        lines = []
        current_speaker = None
        for seg in sorted(segments, key=lambda x: x.start):
            timestamp = f"{int(seg.start//60):02d}:{int(seg.start%60):02d}"
            if seg.speaker and seg.speaker != current_speaker:
                current_speaker = seg.speaker
                lines.append(f"\n*Speaker {current_speaker}:*")
            lines.append(f"[{timestamp}] {seg.text}")
        return "\n".join(lines).strip()

    # Build and run — order matters: more specific filters first
    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(
        filters.VOICE | filters.AUDIO | filters.VIDEO | filters.VIDEO_NOTE,
        handle_voice
    ))
    app.add_handler(MessageHandler(filters.Document.ALL, handle_document))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    logger.info("Bot started. Listening for voice memos, text, and files...")
    app.run_polling()


if __name__ == '__main__':
    main()
