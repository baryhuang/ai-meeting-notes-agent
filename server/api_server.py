"""FastAPI app — /api/status, /api/health, /api/config, and SPA static file serving."""

import asyncio
import os
import platform
import socket
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

from dotenv import dotenv_values, set_key, unset_key
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from server.bot_state import state

app = FastAPI(title="Notesly API", docs_url=None, redoc_url=None)

# CORS — allow the InsForge-hosted frontend (and localhost dev) to call the API
_cors_origins = [
    "https://gx2m4dge.insforge.site",
    "http://localhost:5173",
    "http://localhost:8080",
]
# Also allow any origin set via CORS_ORIGINS env var (comma-separated)
_extra = os.getenv("CORS_ORIGINS", "")
if _extra:
    _cors_origins.extend(o.strip() for o in _extra.split(",") if o.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WEB_DIST = Path(__file__).parent.parent / "web" / "dist"
ENV_FILE = Path(__file__).parent.parent / ".env"

# Known env vars with groups and descriptions
CONFIG_SCHEMA = [
    {"key": "TELEGRAM_BOT_TOKEN", "group": "Telegram", "label": "Bot Token", "required": True, "secret": True},
    {"key": "TELEGRAM_API_ID", "group": "Telegram", "label": "API ID (local server)"},
    {"key": "TELEGRAM_API_HASH", "group": "Telegram", "label": "API Hash (local server)", "secret": True},
    {"key": "ASSEMBLY_API_KEY", "group": "Transcription", "label": "AssemblyAI API Key", "required": True, "secret": True},
    {"key": "OPENAI_API_KEY", "group": "Conversation", "label": "API Key", "secret": True},
    {"key": "OPENAI_BASE_URL", "group": "Conversation", "label": "Base URL", "default": "https://api.openai.com/v1"},
    {"key": "OPENAI_MODEL", "group": "Conversation", "label": "Model", "default": "gpt-4o-mini"},
    {"key": "GLM_API_KEY", "group": "Claude Code Agent", "label": "GLM API Key", "secret": True},
    {"key": "GLM_MODEL", "group": "Claude Code Agent", "label": "Model", "default": "glm-4-plus"},
    {"key": "ANTHROPIC_BASE_URL", "group": "Claude Code Agent", "label": "Anthropic Base URL", "default": "https://api.z.ai/api/anthropic"},
    {"key": "S3_BUCKET", "group": "Storage", "label": "S3 Bucket"},
    {"key": "BOT_NAME", "group": "Storage", "label": "Bot Name", "default": "transcribe-bot"},
    {"key": "AWS_REGION", "group": "Storage", "label": "AWS Region", "default": "us-east-1"},
    {"key": "WEB_PORT", "group": "Server", "label": "Web Port", "default": "8080"},
    {"key": "ZOOM_CLIENT_ID", "group": "Zoom Integration", "label": "Client ID"},
    {"key": "ZOOM_CLIENT_SECRET", "group": "Zoom Integration", "label": "Client Secret", "secret": True},
    {"key": "ZOOM_REDIRECT_URI", "group": "Zoom Integration", "label": "Redirect URI", "default": "http://localhost:8080/api/oauth/zoom/callback"},
    {"key": "INSFORGE_URL", "group": "Zoom Integration", "label": "InsForge URL", "default": "https://gx2m4dge.us-east.insforge.app"},
    {"key": "INSFORGE_ANON_KEY", "group": "Zoom Integration", "label": "InsForge Anon Key", "secret": True},
]

_KNOWN_KEYS = {item["key"] for item in CONFIG_SCHEMA}


def _detect_deployment() -> dict:
    """Auto-detect the deployment environment."""
    env_type = "local"
    detail = platform.node() or "unknown"

    # AWS ECS
    if os.environ.get("ECS_CONTAINER_METADATA_URI") or os.environ.get("ECS_CONTAINER_METADATA_URI_V4"):
        env_type = "aws-ecs"
        cluster = os.environ.get("ECS_CLUSTER", "")
        task_id = os.environ.get("ECS_TASK_ARN", "").rsplit("/", 1)[-1][:12] if os.environ.get("ECS_TASK_ARN") else ""
        detail = f"{cluster}/{task_id}" if cluster else "ECS"
    # AWS EC2
    elif os.environ.get("AWS_EXECUTION_ENV") or (
        os.path.exists("/sys/hypervisor/uuid") and open("/sys/hypervisor/uuid").read(3) == "ec2"
    ):
        env_type = "aws-ec2"
        detail = platform.node()
    # Docker (but not ECS)
    elif os.path.exists("/.dockerenv") or os.path.exists("/run/.containerenv"):
        env_type = "docker"
        detail = platform.node()
    # Systemd service
    elif os.environ.get("INVOCATION_ID"):
        env_type = "systemd"
        detail = platform.node()

    region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or ""

    return {
        "type": env_type,
        "hostname": platform.node(),
        "private_ip": _get_local_ip(),
        "public_ip": _get_public_ip(),
        "region": region,
        "detail": detail,
        "python": platform.python_version(),
        "os": f"{platform.system()} {platform.release()}",
    }


def _get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def _get_public_ip() -> str:
    try:
        resp = urllib.request.urlopen("https://checkip.amazonaws.com", timeout=3)
        return resp.read().decode().strip()
    except Exception:
        return ""


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/status")
async def status():
    uptime_seconds = None
    if state.started_at:
        uptime_seconds = (datetime.now() - state.started_at).total_seconds()

    return {
        "bot_name": state.bot_name,
        "started_at": state.started_at.isoformat() if state.started_at else None,
        "uptime_seconds": uptime_seconds,
        "last_activity": state.last_activity.isoformat() if state.last_activity else None,
        "modules": {
            "transcription": {"enabled": True, "provider": "AssemblyAI"},
            "chat": {
                "enabled": state.ai_enabled,
                "provider": "OpenAI-compatible",
                "model": state.openai_model,
            },
            "file_analysis": {
                "enabled": state.glm_enabled,
                "provider": "GLM / Claude Agent",
                "model": state.glm_model,
                "base_url": state.anthropic_base_url,
            },
            "storage": {
                "enabled": True,
                "local": True,
                "s3": state.s3_enabled,
                "s3_bucket": state.s3_bucket,
            },
        },
        "zoom": {
            "enabled": state.zoom_enabled,
            "email": state.zoom_email,
            "transcript_count": state.zoom_transcript_count,
            "last_poll": state.zoom_last_poll.isoformat() if state.zoom_last_poll else None,
        },
        "counters": {
            "transcriptions": state.transcription_count,
            "chats": state.chat_count,
            "files": state.file_count,
        },
        "recent_errors": state.recent_errors,
        "deployment": _detect_deployment(),
    }


@app.get("/api/config")
async def get_config():
    values = dotenv_values(str(ENV_FILE)) if ENV_FILE.exists() else {}
    result = []
    for item in CONFIG_SCHEMA:
        val = values.get(item["key"], "")
        if item.get("secret") and val:
            masked = "***" + val[-4:] if len(val) > 4 else "****"
        else:
            masked = val
        result.append({**item, "value": masked, "is_set": bool(val)})
    return {"config": result, "env_file": str(ENV_FILE)}


class ConfigChanges(BaseModel):
    changes: dict[str, str]


@app.post("/api/config")
async def save_config(body: ConfigChanges):
    # Ensure .env file exists
    if not ENV_FILE.exists():
        ENV_FILE.touch()

    saved_keys = []
    for key, value in body.changes.items():
        if key not in _KNOWN_KEYS:
            continue
        if value == "":
            unset_key(str(ENV_FILE), key)
        else:
            set_key(str(ENV_FILE), key, value)
        saved_keys.append(key)
    return {"status": "saved", "keys": saved_keys}


@app.post("/api/restart")
async def restart():
    """Restart the bot process to pick up new .env values."""
    loop = asyncio.get_event_loop()
    loop.call_later(0.5, _do_restart)
    return {"status": "restarting"}


def _do_restart():
    """Replace the current process with a fresh one."""
    os.execv(sys.executable, [sys.executable] + sys.argv)


# Mount static assets if the built frontend exists
if WEB_DIST.exists() and (WEB_DIST / "index.html").exists():
    # Mount assets with a specific path so it doesn't catch everything
    assets_dir = WEB_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # Serve other static files at root (favicon, etc.)
    @app.get("/{path:path}")
    async def spa_fallback(path: str):
        # Try to serve the exact file first
        file_path = WEB_DIST / path
        if path and file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        # Otherwise serve index.html (SPA routing)
        return FileResponse(str(WEB_DIST / "index.html"))
