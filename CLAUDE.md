# CLAUDE.md

## Project Overview

Telegram voice memo transcription bot with a web dashboard. Users send voice memos or files via Telegram, the bot transcribes with AssemblyAI (speaker diarization, auto language detection), and optionally syncs to S3. A React dashboard (Metronic) shows bot status, module health, and activity counters.

## Key Commands

```bash
# Run bot + dashboard (port 8080)
uv run server/telegram_bot.py

# Manual transcription (standalone CLI, stays in root)
source .venv/bin/activate
python transcribe.py -i recording.m4a
python transcribe.py -f /path/to/recordings/
python transcribe.py -i recording.m4a --force-overwrite

# Drive watcher (standalone daemon, stays in root)
python drive_watcher.py              # daemon mode
python drive_watcher.py --dry-run    # list unprocessed files

# Frontend dev
cd web && npm install && npm run dev  # dashboard on :5173, proxies /api to :8080

# Docker
docker compose up --build             # bot + dashboard on :8080

# Server setup (Linux)
chmod +x setup_server.sh && ./setup_server.sh
```

## Architecture

### Server (`server/`)
- `server/telegram_bot.py` — Main entry point: Telegram bot + FastAPI on port 8080
- `server/api_server.py` — FastAPI app (`/api/status`, `/api/health`, SPA serving)
- `server/bot_state.py` — Shared state singleton (module status, counters, errors)
- `server/src/transcription/transcriber.py` — AssemblyAI integration, speaker diarization, transcript caching
- `server/src/models/transcription.py` — TranscriptionSegment data class

### Web (`web/`)
- Metronic React starter kit (Layout 1 only)
- `web/src/pages/dashboard/page.tsx` — Main dashboard page
- `web/src/hooks/use-bot-status.ts` — react-query hook polling `/api/status`
- `web/vite.config.ts` — Proxy `/api` to `:8080` in dev mode

### Root (standalone tools)
- `transcribe.py` — CLI entry point, handles language detection and file discovery
- `drive_watcher.py` — Daemon polling local inbox dir, calls transcribe for new files
- `scripts/rclone-sync.sh` — Pull files from / push transcripts to Google Drive
- `systemd/` — Service files for Linux deployment

## API Dependencies

- `ASSEMBLY_API_KEY` — AssemblyAI for transcription with speaker diarization
- `TELEGRAM_BOT_TOKEN` — Telegram Bot API
- `OPENAI_API_KEY` (optional) — Chat and summarization
- `GLM_API_KEY` (optional) — File analysis via Claude Agent SDK
- `S3_BUCKET` (optional) — S3 sync for file storage

## Language Detection

Cascading: explicit `--language-code` > filename suffix (`_en`, `_zh`) > AssemblyAI auto-detection
