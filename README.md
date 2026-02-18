# ai-meeting-notes-agent

> One click flow that turns recordings into personalized meeting notes and action items.

Currently implements the first stage of the pipeline: automated voice memo transcription. Team members record voice memos on iPhones, share them to a Google Drive folder, and this system automatically transcribes them using AssemblyAI (with speaker diarization) and pushes results back to Drive.

**Roadmap**: transcription (done) -> summarization -> action item extraction -> personalized notes per participant.

## How It Works

```
iPhone Voice Memo -> Share to Google Drive shared folder
                              |
        Linux cron: rclone copy (pull new files every 60s)
                              |
                    /srv/transcribe/inbox/
                              |
            drive_watcher.py (polling local dir)
                              |
            transcribe -> .transcript.json + .transcript.txt
                              |
        Linux cron: rclone copy (push results back to Drive)
```

## Quick Start

```bash
git clone <repo-url>
cd ai-meeting-notes-agent
chmod +x setup_server.sh && ./setup_server.sh
```

The setup script walks through everything interactively: installs deps, opens browser for Google auth, configures `.env`, and installs systemd services.

## Manual Usage

```bash
source .venv/bin/activate

# Transcribe a single file
python transcribe.py -i recording.m4a

# Transcribe all files in a folder
python transcribe.py -f /path/to/recordings/

# Force re-transcription of existing files
python transcribe.py -i recording.m4a --force-overwrite

# Run the drive watcher daemon
python drive_watcher.py

# Dry run (list unprocessed files without transcribing)
python drive_watcher.py --dry-run
```

## Language Detection

Language is detected automatically via a cascading strategy:

1. **Explicit flag**: `--language-code en`
2. **Filename suffix**: `meeting_en.m4a` -> detected as English
3. **Auto-detect**: Falls back to AssemblyAI's automatic language detection (99 languages)

## Supported Formats

Audio: `.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`
Video: `.mp4`, `.avi`, `.mov`, `.mkv`, `.webm`

## Configuration

Copy `.env.example` to `.env` and fill in:

```
ASSEMBLY_API_KEY=your_key_here    # Required - AssemblyAI transcription
RCLONE_REMOTE=gdrive              # rclone remote name
GDRIVE_FOLDER=VoiceMemos          # Google Drive folder to watch
LOCAL_INBOX_DIR=/srv/transcribe/inbox
```

## Service Management

```bash
# Start services
sudo systemctl start drive-watcher rclone-sync.timer

# Check status
systemctl status drive-watcher rclone-sync.timer

# View logs
journalctl -u drive-watcher -f
```

## Project Structure

```
transcribe.py           # CLI entry point for manual transcription
drive_watcher.py        # Daemon that watches inbox for new files
src/
  transcription/
    transcriber.py      # AssemblyAI integration, speaker diarization
  models/
    transcription.py    # TranscriptionSegment data class
scripts/
  rclone-sync.sh        # Pull from / push to Google Drive
systemd/                # Linux service files
setup_server.sh         # One-command server setup
```
