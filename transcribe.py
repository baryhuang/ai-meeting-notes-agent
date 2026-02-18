#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
CLI entry point for transcribing audio/video files.
"""

import os
import sys
import argparse
import logging
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {
    '.mp4', '.avi', '.mov', '.mkv', '.webm',
    '.mp3', '.wav', '.m4a', '.aac', '.ogg'
}

# Common language codes supported by AssemblyAI
SUPPORTED_LANGUAGE_CODES = {
    'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'hi', 'ja', 'zh', 'fi', 'ko',
    'pl', 'ru', 'tr', 'uk', 'vi', 'ar', 'cs', 'da', 'el', 'he', 'hu', 'id',
    'ms', 'no', 'ro', 'sk', 'sv', 'th', 'bg', 'ca', 'hr', 'lt', 'lv', 'sl',
    'et', 'mk', 'sr', 'ta', 'te', 'ml', 'kn', 'mr', 'gu', 'pa', 'bn', 'ur'
}


def extract_language_from_filename(file_path: str):
    """
    Extract language code from filename suffix (e.g., meeting_en.m4a -> 'en').
    Returns None if no valid language code found.
    """
    stem = Path(file_path).stem
    if '_' not in stem:
        return None
    parts = stem.rsplit('_', 1)
    if len(parts) != 2:
        return None
    potential = parts[1].lower()
    if potential in SUPPORTED_LANGUAGE_CODES:
        logger.info(f"Detected language code '{potential}' from filename: {Path(file_path).name}")
        return potential
    return None


def find_supported_files(folder_path: str):
    """Recursively find all supported audio/video files in a folder."""
    found = []
    for root, _, files in os.walk(folder_path):
        for f in sorted(files):
            if Path(f).suffix.lower() in SUPPORTED_EXTENSIONS:
                found.append(os.path.join(root, f))
    return found


def process_single_file(input_file: str, language_code=None, force_overwrite: bool = False) -> bool:
    """Transcribe a single file."""
    from src.transcription import transcribe_video, create_text_transcript

    try:
        # Determine language: explicit > filename > auto-detect
        lang = language_code
        if lang is None:
            lang = extract_language_from_filename(input_file)
        if lang:
            logger.info(f"Using language code: {lang}")
        else:
            logger.info("No language code specified - will use AssemblyAI auto-detection")

        logger.info(f"Transcribing: {input_file}")
        segments = transcribe_video(input_file, lang, force_overwrite)

        # Create plain text transcript
        txt_path = Path(input_file).with_suffix('.transcript.txt')
        if not txt_path.exists() or force_overwrite:
            create_text_transcript(input_file, segments)

        logger.info("Transcription completed.")
        return True

    except Exception as e:
        logger.error(f"Failed to transcribe {input_file}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description='Transcribe audio/video files using AssemblyAI with speaker diarization.'
    )
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument('--input-file', '-i', help='Path to a single audio/video file')
    input_group.add_argument('--input-folder', '-f', help='Path to folder of audio/video files')
    parser.add_argument('--language-code', type=str, default=None,
                        help='Language code (e.g., en, zh). Auto-detected from filename or by AssemblyAI if not specified.')
    parser.add_argument('--force-overwrite', action='store_true',
                        help='Force re-transcription even if transcript files already exist')

    args = parser.parse_args()

    # Verify API key
    if not os.getenv('ASSEMBLY_API_KEY'):
        logger.error("ASSEMBLY_API_KEY not set. Add it to .env or environment.")
        sys.exit(1)

    import assemblyai as aai
    aai.settings.api_key = os.getenv('ASSEMBLY_API_KEY')

    if args.input_file:
        if not os.path.isfile(args.input_file):
            logger.error(f"File not found: {args.input_file}")
            sys.exit(1)
        success = process_single_file(args.input_file, args.language_code, args.force_overwrite)
        sys.exit(0 if success else 1)
    else:
        if not os.path.isdir(args.input_folder):
            logger.error(f"Folder not found: {args.input_folder}")
            sys.exit(1)
        files = find_supported_files(args.input_folder)
        if not files:
            logger.warning(f"No supported files found in {args.input_folder}")
            sys.exit(0)
        logger.info(f"Found {len(files)} file(s) to process")
        failed = 0
        for f in files:
            if not process_single_file(f, args.language_code, args.force_overwrite):
                failed += 1
        if failed:
            logger.warning(f"{failed}/{len(files)} file(s) failed")
        sys.exit(1 if failed == len(files) else 0)


if __name__ == '__main__':
    main()
