# ai-meeting-notes-agent

> The open source, free alternative to Granola. Your iPhone already has the best meeting recorder — you just don't have a way to use it.

## Free to use. No catch.

**Try it now at [notesly.app](https://notesly.app)** — completely free through May 2026. No limits on minutes, no paywalls, no credit card. Just send a voice memo and get a transcript.

Want to own it? Self-host this repo with your own API keys. Free forever. MIT licensed.

## The Problem

- **Recording apps are unreliable.** Granola, Otter, Fireflies — they crash, need the app open, can't start from the lock screen. Apple Voice Memos just works. One tap.
- **But voice memos go nowhere.** You have hundreds on your phone. You'll never listen to them again.
- **Transcription costs money.** $20/month for Otter, $30/month for Fireflies, $19/month for Granola. Just to read what you already said.
- **Self-hosted alternatives need a local machine.** OpenClaw, ClawdBot — you have to keep a computer running 24/7.

## The Solution

Record with Voice Memos. Send it on Telegram. Get the transcript back.

1. **Record** with Apple Voice Memos (or any voice recorder on your phone)
2. **Share** the recording directly to Telegram — no opening another app, no exporting, no emailing yourself
3. **Read** the full transcript — with speaker labels and timestamps — right in the chat. Copy, forward, search it. It's already where your conversations live.

No account to create. No 100-step setup. No hunting for a transcript buried in some other app. Just Telegram and a 2-minute bot setup.

Works with any language. Handles multiple speakers. Transcripts come back in under a minute.

## Prerequisites

You need two API keys. Both are free to get:

| Key | What it's for | Where to get it | Cost |
|-----|--------------|-----------------|------|
| `TELEGRAM_BOT_TOKEN` | Receive and reply to voice memos | Message [@BotFather](https://t.me/BotFather) on Telegram, send `/newbot` | Free |
| `ASSEMBLY_API_KEY` | Transcription with speaker labels | [assemblyai.com/app/account](https://www.assemblyai.com/app/account) | Free tier included |

That's it. No other accounts, services, or API keys required.

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

Edit `.env` and fill in your two API keys:
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

### Railway (one click)

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/new?repo=your-repo-url)

Set `ASSEMBLY_API_KEY` and `TELEGRAM_BOT_TOKEN` as environment variables in the Railway dashboard.

### AWS ECS (via GitHub Actions)

Fork this repo, add 4 secrets in GitHub repo settings, and push. It deploys automatically.

| GitHub Secret | Value |
|---------------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `ASSEMBLY_API_KEY` | Your AssemblyAI key |
| `TELEGRAM_BOT_TOKEN` | Your bot token from BotFather |

Every push to `main` builds and deploys to ECS Fargate (~$3-5/month). You can also trigger it manually from the Actions tab.

### Any server with Docker

The bot uses polling (no inbound ports needed), so it runs anywhere Docker runs — a $5 VPS, a Raspberry Pi, or your laptop. Just `docker compose up -d`.

### Already have a backlog?

Got a folder full of voice memos you never transcribed? Do them all at once:

```bash
uv run transcribe.py -f /path/to/recordings/
```

## Supported Formats

Voice notes from Telegram, iPhone Voice Memos, and any standard audio/video format: `.m4a`, `.mp3`, `.ogg`, `.wav`, `.mp4`, `.mov`, and more.

## What's Next

- **Summarization** — turn a 20-minute ramble into a 1-paragraph summary
- **Action items** — pull out who needs to do what, automatically
- **Personalized notes** — each participant gets notes relevant to them

## Technical Details

See [TECHNICAL.md](TECHNICAL.md) for architecture, configuration, Google Drive watcher, and deployment instructions.
