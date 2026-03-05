# Repurpose Plan: From Showcase → Founder Tool

## 1. Telegram Bot — Strip to Core

**Remove:**
- `_chat()`, `_CHAT_TOOLS`, `_analyze_with_file_agent()` — AI conversation loop
- `_chat_histories` / `_load_chat_histories()` / `_save_chat_histories()` — history persistence
- Claude Agent SDK / GLM integration entirely
- `bot_state.chat_count`

**Keep:**
- `handle_voice()` — voice/audio/video → transcribe
- `handle_document()` — audio/video docs → transcribe, other files → store
- `handle_text()` — simplified: accept text as a file (save to S3), no AI chat
- `_summarize()` — OpenAI summarization of long transcripts
- S3 sync, dedup index, FastAPI server

## 2. Web — Replace with caremojo-atlas

**Remove:** Entire `web/` React app

**Replace with:** caremojo-atlas static site:
- `index.html` — Decision Atlas (D3 trees + markmap mindmap)
- `executive-report.html` — integrated into sidebar nav
- `css/theme.css`, `js/*.js`, `data/*.json`

**Deploy to:** insforge-notesly (static site)

## 3. New API: Atlas Data Update

Add endpoint for external tools to update atlas JSON data:

```
PUT /api/atlas/data/{filename}
```
- Accepts JSON body, writes to `data/{filename}.json`
- Validates filename against known dimensions
- Serves current data via GET for the static site

```
GET /api/atlas/data/{filename}
```
- Returns the JSON content for a given dimension

## 4. API Cleanup

**Keep:** `/api/health`, `/api/status` (remove chat_count), static file serving
**Add:** `/api/atlas/data/{filename}` (GET + PUT)
**Remove:** `/api/config`, `/api/restart`

## 5. Deployment

- **Bot + API**: ECS (serves both bot and atlas API)
- **Web (atlas static)**: insforge-notesly
- Atlas fetches data from the API (or bundled static JSON — TBD based on deploy model)
