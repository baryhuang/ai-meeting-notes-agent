#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Drive watcher daemon that monitors a local directory for new audio/video files
and automatically runs transcription on them.

Designed to work with rclone syncing files from Google Drive.
"""

import os
import sys
import json
import time
import signal
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

POLL_INTERVAL = 10  # seconds between directory scans
STABLE_WAIT = 30    # seconds file size must be unchanged before processing


class FileTracker:
    """Tracks which files have already been processed."""

    def __init__(self, tracker_path: str):
        self.path = Path(tracker_path)
        self.processed: dict = {}
        self._load()

    def _load(self):
        if self.path.exists():
            try:
                self.processed = json.loads(self.path.read_text())
            except (json.JSONDecodeError, OSError) as e:
                logger.warning(f"Could not load tracker file: {e}")
                self.processed = {}

    def _save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(self.processed, indent=2))

    def is_processed(self, filepath: str) -> bool:
        return filepath in self.processed

    def mark_processed(self, filepath: str, success: bool):
        self.processed[filepath] = {
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S'),
            'success': success
        }
        self._save()


def is_supported_file(filepath: str) -> bool:
    return Path(filepath).suffix.lower() in SUPPORTED_EXTENSIONS


def is_file_stable(filepath: str, wait_seconds: int = STABLE_WAIT) -> bool:
    """Check if a file's size has stopped changing (rclone finished writing)."""
    try:
        size1 = os.path.getsize(filepath)
        time.sleep(wait_seconds)
        size2 = os.path.getsize(filepath)
        return size1 == size2 and size2 > 0
    except OSError:
        return False


def find_new_files(inbox_dir: str, tracker: FileTracker) -> list:
    """Find supported files in inbox that haven't been processed yet."""
    new_files = []
    inbox = Path(inbox_dir)
    if not inbox.exists():
        logger.warning(f"Inbox directory does not exist: {inbox_dir}")
        return new_files

    for filepath in sorted(inbox.rglob('*')):
        if filepath.is_file() and is_supported_file(str(filepath)):
            abs_path = str(filepath.resolve())
            if not tracker.is_processed(abs_path):
                new_files.append(abs_path)
    return new_files


def process_file(filepath: str) -> bool:
    """Run transcription on a single file."""
    from transcribe import process_single_file
    logger.info(f"Processing: {filepath}")
    success = process_single_file(filepath)
    if success:
        logger.info(f"Completed: {filepath}")
    else:
        logger.error(f"Failed: {filepath}")
    return success


def run_watcher(inbox_dir: str, tracker: FileTracker, dry_run: bool = False):
    """Main watch loop."""
    logger.info(f"Watching directory: {inbox_dir}")
    logger.info(f"Poll interval: {POLL_INTERVAL}s, Stability wait: {STABLE_WAIT}s")

    if dry_run:
        new_files = find_new_files(inbox_dir, tracker)
        if new_files:
            logger.info(f"Found {len(new_files)} unprocessed file(s):")
            for f in new_files:
                logger.info(f"  {f}")
        else:
            logger.info("No unprocessed files found.")
        return

    running = True

    def handle_signal(signum, frame):
        nonlocal running
        logger.info(f"Received signal {signum}, shutting down...")
        running = False

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    while running:
        new_files = find_new_files(inbox_dir, tracker)

        for filepath in new_files:
            if not running:
                break

            logger.info(f"New file detected: {filepath}")
            logger.info(f"Waiting {STABLE_WAIT}s to confirm file is stable...")

            if not is_file_stable(filepath, STABLE_WAIT):
                logger.warning(f"File not stable, skipping for now: {filepath}")
                continue

            try:
                success = process_file(filepath)
                tracker.mark_processed(filepath, success)
            except Exception as e:
                logger.error(f"Unexpected error processing {filepath}: {e}")
                tracker.mark_processed(filepath, False)

        if running:
            time.sleep(POLL_INTERVAL)


def main():
    parser = argparse.ArgumentParser(
        description='Watch a directory for new audio/video files and transcribe them.'
    )
    parser.add_argument(
        '--inbox', '-i',
        default=os.getenv('LOCAL_INBOX_DIR', '/srv/transcribe/inbox'),
        help='Directory to watch (default: $LOCAL_INBOX_DIR or /srv/transcribe/inbox)'
    )
    parser.add_argument(
        '--tracker', '-t',
        default=None,
        help='Path to processed files tracker JSON (default: <inbox>/processed_files.json)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='List unprocessed files without processing them'
    )
    args = parser.parse_args()

    # Set up AssemblyAI API key
    api_key = os.getenv('ASSEMBLY_API_KEY')
    if not api_key:
        logger.error("ASSEMBLY_API_KEY not set. Add it to .env or environment.")
        sys.exit(1)
    import assemblyai as aai
    aai.settings.api_key = api_key

    inbox_dir = args.inbox
    tracker_path = args.tracker or str(Path(inbox_dir) / 'processed_files.json')
    tracker = FileTracker(tracker_path)

    run_watcher(inbox_dir, tracker, dry_run=args.dry_run)


if __name__ == '__main__':
    main()
