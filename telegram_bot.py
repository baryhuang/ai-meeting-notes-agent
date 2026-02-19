#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Telegram voice memo transcription bot.

Send a voice memo to the bot, get a summary + full transcript file back.

Usage:
    uv run telegram_bot.py
"""

import os
import sys
import io
import logging
import datetime
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Transcript storage directory
TRANSCRIPTS_DIR = Path(__file__).parent / "transcripts"

# Short transcripts are sent inline, long ones get summary + file
INLINE_CHAR_LIMIT = 2000


def _get_openai_client():
    """Get OpenAI-compatible client if API key is configured."""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return None
    from openai import OpenAI
    base_url = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')
    return OpenAI(api_key=api_key, base_url=base_url)


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
    inbox = Path(__file__).parent / "inbox"
    inbox.mkdir(exist_ok=True)

    if _get_openai_client():
        logger.info("AI summarization enabled (OPENAI_API_KEY configured)")
    else:
        logger.info("AI summarization disabled (no OPENAI_API_KEY). Will send full transcripts only.")

    async def start(update: Update, context):
        await update.message.reply_text(
            "Hi! Send me a voice memo and I'll transcribe it for you.\n\n"
            "I support voice notes, audio files, and video files.\n"
            "Speaker diarization and auto language detection included."
        )

    async def handle_voice(update: Update, context):
        """Handle voice notes and audio files."""
        msg = update.message
        user = msg.from_user
        logger.info(f"Received voice memo from {user.first_name} ({user.id})")

        # Get the file object (voice note or audio file)
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
        elif msg.document and msg.document.mime_type and msg.document.mime_type.startswith("audio/"):
            file = await msg.document.get_file()
            ext = _mime_to_ext(msg.document.mime_type)
        elif msg.document and msg.document.mime_type and msg.document.mime_type.startswith("video/"):
            file = await msg.document.get_file()
            ext = ".mp4"
        else:
            await msg.reply_text("Please send a voice note or audio file.")
            return

        # Send processing indicator
        processing_msg = await msg.reply_text("Transcribing... this may take a minute.")

        tmp_path = None
        try:
            # Download to temp file
            tmp_path = str(inbox / f"tg_{user.id}_{msg.message_id}{ext}")
            await file.download_to_drive(tmp_path)
            logger.info(f"Downloaded audio to {tmp_path}")

            # Transcribe
            segments = transcribe_video(tmp_path)

            if not segments:
                await processing_msg.edit_text("Sorry, I couldn't transcribe that audio. It might be too short or unclear.")
                return

            # Format transcript
            transcript_text = _format_transcript(segments)

            # Save to centralized storage
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H%M%S")
            transcript_filename = f"{timestamp}_{user.first_name}_{msg.message_id}.txt"
            transcript_path = TRANSCRIPTS_DIR / transcript_filename
            transcript_path.write_text(transcript_text, encoding='utf-8')
            logger.info(f"Saved transcript to {transcript_path}")

            # Short transcripts: send inline
            if len(transcript_text) <= INLINE_CHAR_LIMIT:
                await processing_msg.edit_text(transcript_text, parse_mode="Markdown")
            else:
                # Long transcripts: summarize + attach file
                await processing_msg.edit_text("Transcription done. Generating summary...")

                summary = _summarize(transcript_text)

                if summary:
                    reply_text = f"*Summary:*\n\n{summary}"
                else:
                    # No summarization available — send first part as preview
                    preview = transcript_text[:1500] + "\n\n_(full transcript attached as file)_"
                    reply_text = preview

                await processing_msg.edit_text(reply_text, parse_mode="Markdown")

                # Send full transcript as file
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
            # Clean up audio file (keep transcript in storage)
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

    # Build and run
    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(
        filters.VOICE | filters.AUDIO | filters.VIDEO | filters.VIDEO_NOTE | filters.Document.ALL,
        handle_voice
    ))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, start))

    logger.info("Bot started. Listening for voice memos...")
    app.run_polling()


if __name__ == '__main__':
    main()
