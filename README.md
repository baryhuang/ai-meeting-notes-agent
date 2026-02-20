# ai-meeting-notes-agent

> Voice transcription meets autonomous AI agent. Like [OpenClaw](https://openclaw.ai/) for your voice memos — transcribe, chat, and let an AI agent work with your files, all through Telegram.

## Free and open source.

Self-host with your own API keys. Free forever. MIT licensed.

https://github.com/user-attachments/assets/37a70d2d-ba9c-4335-b466-da24bbf3b4c4


<img width="1418" height="715" alt="notesly_deployment_config_sample" src="https://github.com/user-attachments/assets/40c2bb60-1818-4f9b-ac5e-1b3849beb16a" />

## Core Value

**Transcription + AI agent in one bot.** Two things that belong together but nobody combines:

1. **Transcription** — send a voice memo, get a transcript with speaker labels and timestamps. Any language, any length. That's the entry point.
2. **Autonomous AI agent** — the same bot holds a conversation, summarizes long recordings, and spawns a Claude Code Agent that reads your stored files to answer questions. Like OpenClaw, but specialized for voice-first workflows.

Your Telegram chat becomes a personal AI workspace where voice memos, transcripts, files, and conversations all live together.

## The Problem

- **iPhone Voice Memos is the best recorder.** One tap from the lock screen. No app to open, no meeting to join. It never crashes. Nothing else comes close.
- **But voice memos are a dead end.** You have hundreds on your phone. You'll never listen to them again.
- **Recording apps solve the wrong problem.** Granola, Otter, Fireflies — they replace Voice Memos instead of building on it.
- **AI assistants don't know your context.** ChatGPT, OpenClaw — powerful, but they can't search last Tuesday's meeting or find what your manager said about the deadline.
- **What's missing is the bridge.** Transcription that feeds into an AI agent with memory of everything you've recorded and stored.

## What It Does

Send anything to the Telegram bot. It figures out what to do.

| You send | Bot does |
|----------|----------|
| Voice memo or audio/video file | Transcribes with speaker labels + timestamps. Long recordings get an AI summary. |
| Text message | AI chat — ask questions, get help, have a conversation. |
| Text about your files — *"what did we discuss yesterday?"* | Searches your stored transcripts and files, answers with context. |
| Any other file (PDF, image, doc...) | Stores it for you. Ask about it later. |

All files — audio, transcripts, uploads — are stored locally and optionally synced to S3. Survives container restarts.

## How It Works

1. **Record** with Apple Voice Memos (or any voice recorder on your phone)
2. **Share** the recording directly to Telegram — no opening another app, no exporting, no emailing yourself
3. **Read** the full transcript — with speaker labels and timestamps — right in the chat

Works with any language. Handles multiple speakers. Transcripts come back in under a minute.

## Prerequisites

You need two API keys to get started. Both are free:

| Key | What it's for | Where to get it | Cost |
|-----|--------------|-----------------|------|
| `TELEGRAM_BOT_TOKEN` | Receive and reply to messages | Message [@BotFather](https://t.me/BotFather) on Telegram, send `/newbot` | Free |
| `ASSEMBLY_API_KEY` | Transcription with speaker labels | [assemblyai.com/app/account](https://www.assemblyai.com/app/account) | Free tier included |

### Optional keys (unlock more features)

| Key | What it unlocks |
|-----|----------------|
| `OPENAI_API_KEY` | AI chat + summarization. Works with any OpenAI-compatible API (OpenAI, OpenRouter, DigitalOcean, etc.) |
| `OPENAI_BASE_URL` | Custom endpoint (default: `https://api.openai.com/v1`) |
| `OPENAI_MODEL` | Model for chat + summarization (default: `gpt-4o-mini`) |
| `GLM_API_KEY` | File analysis via [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-python). Ask questions about your stored files. |
| `GLM_MODEL` | Model for file analysis (default: `glm-4-plus`) |
| `ANTHROPIC_BASE_URL` | Anthropic-compatible endpoint (default: `https://api.z.ai/api/anthropic`). Works with Z.AI, Anthropic, or any compatible provider. |
| `S3_BUCKET` | S3 storage sync — all files mirrored to S3, restored on container restart |
| `BOT_NAME` | Storage prefix (default: `transcribe-bot`) |

## Getting Started

### 1. Create a Telegram Bot (2 minutes)

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. Pick a name for your bot (e.g., "My Transcriber")
4. Pick a username (e.g., `my_transcriber_bot`)
5. BotFather gives you an API token — copy it

### 2. Run the Bot

```bash
git clone <repo-url> && cd ai-meeting-notes-agent
cp .env.example .env
```

Edit `.env` and fill in your API keys:
```
ASSEMBLY_API_KEY=your_assemblyai_key
TELEGRAM_BOT_TOKEN=your_bot_token
```

Start the bot:
```bash
uv run telegram_bot.py
```

That's it. Send a voice memo to your bot on Telegram and get a transcript back.

## Deploy

### Docker (any server)

```bash
docker compose up -d
```

The bot uses polling (no inbound ports needed), so it runs anywhere Docker runs — a $5 VPS, a Raspberry Pi, or your laptop.

### AWS ECS (via GitHub Actions)

Fork this repo, add secrets in GitHub repo settings, and push. It deploys automatically.

**Required secrets:**

| GitHub Secret | Value |
|---------------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `ASSEMBLY_API_KEY` | Your AssemblyAI key |
| `TELEGRAM_BOT_TOKEN` | Your bot token from BotFather |

**Optional secrets (for AI + storage features):**

| GitHub Secret | Value |
|---------------|-------|
| `OPENAI_API_KEY` | OpenAI-compatible API key for chat + summarization |
| `OPENAI_BASE_URL` | Custom endpoint URL |
| `OPENAI_MODEL` | Model name |
| `GLM_API_KEY` | API key for file analysis |
| `GLM_MODEL` | Model name for file analysis |
| `ANTHROPIC_BASE_URL` | Anthropic-compatible endpoint URL |
| `S3_BUCKET` | S3 bucket name for file sync |
| `BOT_NAME` | Storage prefix |

Every push to `main` builds and deploys to ECS Fargate. You can also trigger it manually from the Actions tab.

### Railway (one click)

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/new?repo=your-repo-url)

Set your API keys as environment variables in the Railway dashboard.

### Already have a backlog?

Got a folder full of voice memos you never transcribed? Do them all at once:

```bash
uv run transcribe.py -f /path/to/recordings/
```

## Supported Formats

Voice notes from Telegram, iPhone Voice Memos, and any standard audio/video format: `.m4a`, `.mp3`, `.ogg`, `.wav`, `.mp4`, `.mov`, and more.

## Architecture

Like OpenClaw, the bot uses a messaging platform (Telegram) as the primary interface, with modular AI capabilities behind it:

- **Telegram bot** (`telegram_bot.py`) — message router: voice → transcription, text → conversation, files → storage
- **Transcription** — AssemblyAI with speaker diarization, auto language detection, multi-format support
- **Conversation** — OpenAI-compatible LLM for chat, summarization, and Q&A
- **Claude Code Agent** — autonomous agent (via Claude Agent SDK) that reads your stored files and answers questions with full context
- **Storage** — unified `data/{bot_name}/YYYY/MM/DD/` structure, identical paths locally and on S3
- **S3 sync** — bidirectional: pulls from S3 on startup, pushes after every write
- **Web dashboard** — React pipeline visualization showing module status, deployment info, and live configuration

## What's Next

- **Personalized notes** — each participant gets notes relevant to them
- **Calendar integration** — auto-match recordings to meetings
- **Team workspaces** — shared transcripts across a group

## Technical Details

See [TECHNICAL.md](TECHNICAL.md) for detailed architecture, configuration, Google Drive watcher, and deployment instructions.
