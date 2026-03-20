**My friends and I all think OpenClaw is a toy. So I built a remote Claude Code to run my company.**

https://github.com/baryhuang/company-os — Star and fork appreciated.

**Why this exists**

Most startups run their OS on Slack threads, Google Docs nobody reads, and whatever the CEO remembers from last Tuesday. The important stuff lives in people's heads — until they forget it.

My friends and I all tried OpenClaw. It felt like a toy — a chatbot wrapper with no persistent memory, no structured knowledge layer, no way to turn conversations into operational decisions.

So I built Company OS on remote Claude Code.

**How it works**

- **Voice → structured knowledge** — Send voice memos to a Telegram bot. AssemblyAI transcribes with speaker diarization (who said what) and auto language detection. Transcripts get processed into a "Decision Atlas" — a tree-structured knowledge graph organized by strategic dimensions (Market, Product, Build, OKR, etc.). Categories emerge from your conversations, not a template.

- **Postgres-backed knowledge graph** — Each decision node stores status, dates, transcript quotes as evidence, and custom metadata. Stored as flat rows in Postgres with pgvector, synced via a diff-based algorithm that only updates what changed. Auto-snapshots before every sync — basically git for your company brain.

- **Semantic search over everything** — Linear tasks are embedded with `text-embedding-3-small` and searchable by meaning, not keywords. "What's blocking the pilot launch?" actually finds the right tickets. Competitor intelligence uses Claude 4.5 Sonnet to analyze your landscape on the fly.

- **Dashboard with 10+ views** — React/Vite/Bun frontend with markmap mindmaps, D3 trees, OKR tracking, people network, competitor analysis, semantic task search, and a todo board with inline status updates that write directly to the DB.

- **Multi-user workspaces** — Each team member gets their own isolated view of the same knowledge base. Row-level isolation in Postgres, workspace sharing built in.

**Stack**: Python/FastAPI, React 19/Vite/Bun, InsForge (Postgres + pgvector + edge functions), AssemblyAI, Claude 4.5 Sonnet, OpenAI embeddings, AWS S3, Telegram Bot API.

We're a 5-person team in Techstars. Six meetings a day. A week later, nobody used to remember the details. Now every conversation becomes searchable knowledge with evidence trails, and nothing gets lost.

No custom infra to maintain. Just Claude Code + MCP integrations as an actual operating layer.

---

**Disclosure**: I'm the author. This is a free, open-source project (MIT license) — no paid tiers, no referral links, no data collection. Built it for my own team, sharing because others might find it useful. Uses third-party APIs (AssemblyAI, OpenAI, Anthropic) which have their own pricing — the project itself costs nothing.
