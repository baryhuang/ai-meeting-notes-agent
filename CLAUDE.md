# CLAUDE.md

## Project Overview

Automated voice memo transcription pipeline. Team members share voice memos to Google Drive, a Linux server pulls them via rclone, transcribes with AssemblyAI (speaker diarization, auto language detection), and pushes transcripts back.

## Key Commands

```bash
# Manual transcription
source .venv/bin/activate
python transcribe.py -i recording.m4a
python transcribe.py -f /path/to/recordings/
python transcribe.py -i recording.m4a --force-overwrite

# Drive watcher
python drive_watcher.py              # daemon mode
python drive_watcher.py --dry-run    # list unprocessed files

# Server setup (Linux)
chmod +x setup_server.sh && ./setup_server.sh
```

## Architecture

- `transcribe.py` — CLI entry point, handles language detection and file discovery
- `drive_watcher.py` — Daemon polling local inbox dir, calls transcribe for new files
- `src/transcription/transcriber.py` — AssemblyAI integration, speaker diarization, transcript caching
- `src/models/transcription.py` — TranscriptionSegment data class
- `scripts/rclone-sync.sh` — Pull files from / push transcripts to Google Drive
- `systemd/` — Service files for Linux deployment

## API Dependencies

- `ASSEMBLY_API_KEY` — AssemblyAI for transcription with speaker diarization

## Language Detection

Cascading: explicit `--language-code` > filename suffix (`_en`, `_zh`) > AssemblyAI auto-detection
