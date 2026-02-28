# Notesly Web Dashboard

Operational dashboard for [Notesly](../README.md) — a Telegram voice memo transcription bot with AI conversation and file analysis.

## What It Shows

- **Pipeline visualization** — interactive node diagram showing data flow: Telegram → Transcription → Storage, with Conversation and Claude Code Agent branches. Each node displays live module status (active/inactive, provider, model).
- **Bot status** — uptime, last activity, transcription/chat/file counters.
- **Deployment info** — auto-detected environment (AWS ECS, EC2, Docker, systemd, local), public/private IPs, region.
- **Configuration** — click any pipeline node to edit its environment variables (API keys, model selection, endpoints). Save and restart the bot without SSH.
- **Error log** — recent errors with timestamps.

## Stack

- React 19 + TypeScript
- [React Flow](https://reactflow.dev/) for pipeline diagram
- [Metronic](https://keenthemes.com/metronic) (Layout 1) + Tailwind CSS 4
- TanStack Query for API polling
- Vite with `/api` proxy to backend (port 8080)

## Development

```bash
npm install
npm run dev
```

Dashboard runs on `:5173`, proxies `/api` requests to the bot server on `:8080`.

## Build

```bash
npm run build
```

Output goes to `dist/`, served by the bot's FastAPI server as a SPA.
