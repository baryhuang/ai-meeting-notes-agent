#!/bin/bash
# rclone sync script: pulls new files from Google Drive, pushes transcripts back.
# Called by systemd timer or cron every 60 seconds.

set -euo pipefail

# Resolve the project directory (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment
if [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    source "$PROJECT_DIR/.env"
    set +a
fi

RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive}"
GDRIVE_FOLDER="${GDRIVE_FOLDER:-VoiceMemos}"
LOCAL_INBOX_DIR="${LOCAL_INBOX_DIR:-/srv/transcribe/inbox}"

# Pull new files from Drive (skip already-downloaded)
echo "$(date '+%Y-%m-%d %H:%M:%S') Pulling from ${RCLONE_REMOTE}:${GDRIVE_FOLDER}..."
rclone copy "${RCLONE_REMOTE}:${GDRIVE_FOLDER}" "${LOCAL_INBOX_DIR}" \
    --ignore-existing \
    --log-level INFO

# Push transcript results back to Drive
echo "$(date '+%Y-%m-%d %H:%M:%S') Pushing transcripts to ${RCLONE_REMOTE}:${GDRIVE_FOLDER}..."
rclone copy "${LOCAL_INBOX_DIR}" "${RCLONE_REMOTE}:${GDRIVE_FOLDER}" \
    --include "*.transcript.json" \
    --include "*.transcript.txt" \
    --log-level INFO

echo "$(date '+%Y-%m-%d %H:%M:%S') Sync complete."
