#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Telegram voice memo transcription bot.

Send a voice memo to the bot, get a transcript back with speaker labels.

Usage:
    uv run telegram_bot.py
"""

import os
import sys
import logging
import tempfile
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


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

        try:
            # Download to temp file
            inbox = Path(__file__).parent / "inbox"
            inbox.mkdir(exist_ok=True)

            tmp_path = str(inbox / f"tg_{user.id}_{msg.message_id}{ext}")
            await file.download_to_drive(tmp_path)
            logger.info(f"Downloaded audio to {tmp_path}")

            # Transcribe
            segments = transcribe_video(tmp_path)

            if not segments:
                await processing_msg.edit_text("Sorry, I couldn't transcribe that audio. It might be too short or unclear.")
                return

            # Format and send transcript
            transcript_text = _format_transcript(segments)

            # Telegram message limit is 4096 chars
            if len(transcript_text) <= 4000:
                await processing_msg.edit_text(transcript_text, parse_mode="Markdown")
            else:
                await processing_msg.delete()
                chunks = _split_text(transcript_text, 4000)
                for i, chunk in enumerate(chunks):
                    header = f"*[Part {i+1}/{len(chunks)}]*\n\n" if len(chunks) > 1 else ""
                    await msg.reply_text(header + chunk, parse_mode="Markdown")

            logger.info(f"Sent transcript to {user.first_name} ({len(segments)} segments)")

        except Exception as e:
            logger.error(f"Transcription failed for {user.first_name}: {e}", exc_info=True)
            await processing_msg.edit_text(f"Sorry, transcription failed. Please try again.\nError: {str(e)[:200]}")

        finally:
            # Clean up audio file (keep transcript cache)
            if os.path.exists(tmp_path):
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

    def _split_text(text: str, max_len: int) -> list:
        chunks = []
        current = ""
        for line in text.split("\n"):
            if len(current) + len(line) + 1 > max_len:
                chunks.append(current)
                current = line
            else:
                current = current + "\n" + line if current else line
        if current:
            chunks.append(current)
        return chunks

    # Build and run
    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(
        filters.VOICE | filters.AUDIO | filters.VIDEO | filters.VIDEO_NOTE | filters.Document.ALL,
        handle_voice
    ))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, start))

    logger.info("Bot started. Listening for voice memos...")
    logger.info("Send a voice memo to @baryyyyy_bot on Telegram")
    app.run_polling()


if __name__ == '__main__':
    main()
