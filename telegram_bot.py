#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Telegram voice memo transcription bot.

Send a voice memo to the bot, get a summary + full transcript file back.
Send text to chat with the AI assistant.
Send any other file and it gets stored for you.

Usage:
    uv run telegram_bot.py
"""

import os
import sys
import io
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

# Transcript storage directory (local fallback)
TRANSCRIPTS_DIR = Path(__file__).parent / "transcripts"
FILES_DIR = Path(__file__).parent / "files"

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


def _upload_to_s3(s3_client, bucket: str, bot_name: str, username: str, timestamp: str, filename: str, data: bytes | str):
    """Upload a file to S3 with bot/date/user structure."""
    now = datetime.datetime.now()
    key = f"{bot_name}/{now.strftime('%Y/%m/%d')}/{timestamp}_{username}/{filename}"
    body = data.encode('utf-8') if isinstance(data, str) else data
    s3_client.put_object(Bucket=bucket, Key=key, Body=body)
    logger.info(f"Uploaded to s3://{bucket}/{key}")
    return key


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


def _chat(user_id: int, message: str) -> str | None:
    """Chat with AI, maintaining per-user conversation history."""
    client = _get_openai_client()
    if not client:
        return None

    model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')

    # Get or create history for this user
    if user_id not in _chat_histories:
        _chat_histories[user_id] = []
    history = _chat_histories[user_id]

    # Add user message
    history.append({"role": "user", "content": message})

    # Trim to max history
    if len(history) > MAX_HISTORY:
        history[:] = history[-MAX_HISTORY:]

    try:
        messages = [
            {"role": "system", "content": (
                "You are a helpful assistant integrated into a Telegram bot. "
                "You help with meeting notes, transcription questions, and general tasks. "
                "Be concise and conversational. Use markdown formatting when helpful."
            )},
            *history
        ]
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=1024,
        )
        reply = response.choices[0].message.content
        history.append({"role": "assistant", "content": reply})
        return reply
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        # Remove the failed user message from history
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

    # Ensure storage dirs exist
    TRANSCRIPTS_DIR.mkdir(exist_ok=True)
    FILES_DIR.mkdir(exist_ok=True)
    inbox = Path(__file__).parent / "inbox"
    inbox.mkdir(exist_ok=True)

    s3_client, s3_bucket = _get_s3_client()
    bot_name = os.getenv('BOT_NAME', 'transcribe-bot')

    ai_enabled = bool(_get_openai_client())
    if ai_enabled:
        logger.info("AI enabled (OPENAI_API_KEY configured) — chat + summarization active")
    else:
        logger.info("AI disabled (no OPENAI_API_KEY). Chat and summarization unavailable.")

    if s3_client:
        logger.info(f"S3 storage enabled (bucket: {s3_bucket})")
    else:
        logger.info("S3 storage disabled (no S3_BUCKET). Saving files locally.")

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

    async def handle_voice(update: Update, context):
        """Handle voice notes, audio files, and video files → transcribe."""
        msg = update.message
        user = msg.from_user
        logger.info(f"Received voice memo from {user.first_name} ({user.id})")

        # Get the file object
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
            # Should not reach here due to filter, but just in case
            return

        processing_msg = await msg.reply_text("Transcribing... this may take a minute.")

        tmp_path = None
        try:
            tmp_path = str(inbox / f"tg_{user.id}_{msg.message_id}{ext}")
            await file.download_to_drive(tmp_path)
            logger.info(f"Downloaded audio to {tmp_path}")

            segments = transcribe_video(tmp_path)

            if not segments:
                await processing_msg.edit_text("Sorry, I couldn't transcribe that audio. It might be too short or unclear.")
                return

            transcript_text = _format_transcript(segments)

            # Save to storage
            timestamp = datetime.datetime.now().strftime("%H%M%S")
            transcript_filename = f"{datetime.datetime.now().strftime('%Y-%m-%d')}_{timestamp}_{user.first_name}.txt"
            username = user.first_name or str(user.id)

            if s3_client:
                with open(tmp_path, 'rb') as f:
                    _upload_to_s3(s3_client, s3_bucket, bot_name, username, timestamp, f"audio{ext}", f.read())
                _upload_to_s3(s3_client, s3_bucket, bot_name, username, timestamp, "transcript.txt", transcript_text)
            else:
                transcript_path = TRANSCRIPTS_DIR / transcript_filename
                transcript_path.write_text(transcript_text, encoding='utf-8')
                logger.info(f"Saved transcript to {transcript_path}")

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

                file_bytes = io.BytesIO(transcript_text.encode('utf-8'))
                file_bytes.name = transcript_filename
                await msg.reply_document(
                    document=file_bytes,
                    filename=transcript_filename,
                    caption="Full transcript with speaker labels and timestamps."
                )

            logger.info(f"Sent transcript to {user.first_name} ({len(segments)} segments)")

        except Exception as e:
            logger.error(f"Transcription failed for {user.first_name}: {e}", exc_info=True)
            await processing_msg.edit_text(f"Sorry, transcription failed. Please try again.\nError: {str(e)[:200]}")

        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

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

        reply = _chat(user.id, text)
        if reply:
            await msg.reply_text(reply, parse_mode="Markdown")
        else:
            await msg.reply_text("Sorry, I couldn't process that. Please try again.")

    async def handle_document(update: Update, context):
        """Handle non-audio/video documents → store the file."""
        msg = update.message
        user = msg.from_user
        doc = msg.document

        if not doc:
            return

        mime = doc.mime_type or ""

        # Route audio/video documents to transcription
        if mime.startswith("audio/") or mime.startswith("video/"):
            return await _handle_audio_document(update, context)

        logger.info(f"Received file from {user.first_name}: {doc.file_name} ({mime})")

        processing_msg = await msg.reply_text("Saving your file...")

        try:
            file = await doc.get_file()
            filename = doc.file_name or f"file_{msg.message_id}"
            username = user.first_name or str(user.id)
            timestamp = datetime.datetime.now().strftime("%H%M%S")

            if s3_client:
                # Download to memory and upload to S3
                file_data = await file.download_as_bytearray()
                key = _upload_to_s3(s3_client, s3_bucket, bot_name, username, timestamp, filename, bytes(file_data))
                await processing_msg.edit_text(f"Saved: `{filename}`", parse_mode="Markdown")
            else:
                # Save locally
                user_dir = FILES_DIR / username
                user_dir.mkdir(exist_ok=True)
                local_path = user_dir / f"{timestamp}_{filename}"
                await file.download_to_drive(str(local_path))
                logger.info(f"Saved file to {local_path}")
                await processing_msg.edit_text(f"Saved: `{filename}`", parse_mode="Markdown")

        except Exception as e:
            logger.error(f"File save failed for {user.first_name}: {e}", exc_info=True)
            await processing_msg.edit_text(f"Sorry, couldn't save the file.\nError: {str(e)[:200]}")

    async def _handle_audio_document(update: Update, context):
        """Route audio/video documents sent as files to transcription."""
        msg = update.message
        user = msg.from_user
        doc = msg.document
        mime = doc.mime_type or ""

        logger.info(f"Received audio/video document from {user.first_name} ({user.id})")

        if mime.startswith("audio/"):
            ext = _mime_to_ext(mime)
        else:
            ext = ".mp4"

        processing_msg = await msg.reply_text("Transcribing... this may take a minute.")

        tmp_path = None
        try:
            file = await doc.get_file()
            tmp_path = str(inbox / f"tg_{user.id}_{msg.message_id}{ext}")
            await file.download_to_drive(tmp_path)
            logger.info(f"Downloaded audio to {tmp_path}")

            segments = transcribe_video(tmp_path)

            if not segments:
                await processing_msg.edit_text("Sorry, I couldn't transcribe that audio. It might be too short or unclear.")
                return

            transcript_text = _format_transcript(segments)

            timestamp = datetime.datetime.now().strftime("%H%M%S")
            transcript_filename = f"{datetime.datetime.now().strftime('%Y-%m-%d')}_{timestamp}_{user.first_name}.txt"
            username = user.first_name or str(user.id)

            if s3_client:
                with open(tmp_path, 'rb') as f:
                    _upload_to_s3(s3_client, s3_bucket, bot_name, username, timestamp, f"audio{ext}", f.read())
                _upload_to_s3(s3_client, s3_bucket, bot_name, username, timestamp, "transcript.txt", transcript_text)
            else:
                transcript_path = TRANSCRIPTS_DIR / transcript_filename
                transcript_path.write_text(transcript_text, encoding='utf-8')
                logger.info(f"Saved transcript to {transcript_path}")

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
                file_bytes = io.BytesIO(transcript_text.encode('utf-8'))
                file_bytes.name = transcript_filename
                await msg.reply_document(
                    document=file_bytes,
                    filename=transcript_filename,
                    caption="Full transcript with speaker labels and timestamps."
                )

            logger.info(f"Sent transcript to {user.first_name} ({len(segments)} segments)")

        except Exception as e:
            logger.error(f"Transcription failed for {user.first_name}: {e}", exc_info=True)
            await processing_msg.edit_text(f"Sorry, transcription failed. Please try again.\nError: {str(e)[:200]}")

        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

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
    # Voice/audio/video native types → transcribe
    app.add_handler(MessageHandler(
        filters.VOICE | filters.AUDIO | filters.VIDEO | filters.VIDEO_NOTE,
        handle_voice
    ))
    # Documents (audio/video docs route to transcription internally, others get stored)
    app.add_handler(MessageHandler(filters.Document.ALL, handle_document))
    # Text → AI chat
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    logger.info("Bot started. Listening for voice memos, text, and files...")
    app.run_polling()


if __name__ == '__main__':
    main()
