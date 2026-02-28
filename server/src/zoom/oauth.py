"""FastAPI router for Zoom OAuth — authorize, callback, status, disconnect."""

import base64
import logging
import os
import time
from datetime import datetime
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Query
from fastapi.responses import RedirectResponse, JSONResponse

from server.src.zoom.insforge_db import InsForgeDB

logger = logging.getLogger(__name__)

router = APIRouter()

ZOOM_AUTHORIZE_URL = "https://zoom.us/oauth/authorize"
ZOOM_TOKEN_URL = "https://zoom.us/oauth/token"
ZOOM_USER_URL = "https://api.zoom.us/v2/users/me"

# Lazily initialized InsForge client (set during app startup)
_insforge_db: InsForgeDB | None = None


def init_insforge(db: InsForgeDB):
    global _insforge_db
    _insforge_db = db


def _get_db() -> InsForgeDB:
    if _insforge_db is None:
        raise RuntimeError("InsForge DB not initialized")
    return _insforge_db


@router.get("/authorize")
async def authorize():
    """Redirect user to Zoom OAuth consent screen."""
    client_id = os.getenv("ZOOM_CLIENT_ID", "")
    redirect_uri = os.getenv("ZOOM_REDIRECT_URI", "")

    if not client_id or not redirect_uri:
        return JSONResponse(
            {"error": "ZOOM_CLIENT_ID and ZOOM_REDIRECT_URI must be configured"},
            status_code=500,
        )

    params = urlencode({
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
    })
    return RedirectResponse(f"{ZOOM_AUTHORIZE_URL}?{params}")


@router.get("/callback")
async def callback(code: str = Query(...)):
    """Exchange authorization code for tokens and store in InsForge."""
    client_id = os.getenv("ZOOM_CLIENT_ID", "")
    client_secret = os.getenv("ZOOM_CLIENT_SECRET", "")
    redirect_uri = os.getenv("ZOOM_REDIRECT_URI", "")

    # Basic Auth header (Zoom's required pattern)
    creds = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

    async with httpx.AsyncClient(timeout=30) as http:
        # Exchange code for tokens
        resp = await http.post(
            ZOOM_TOKEN_URL,
            headers={
                "Authorization": f"Basic {creds}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
            },
        )

        if resp.status_code != 200:
            logger.error(f"Zoom token exchange failed: {resp.status_code} {resp.text}")
            return JSONResponse(
                {"error": "Token exchange failed", "detail": resp.text},
                status_code=400,
            )

        token_data = resp.json()
        access_token = token_data["access_token"]
        expires_at = int(time.time()) + token_data.get("expires_in", 3600)

        # Fetch user info
        user_resp = await http.get(
            ZOOM_USER_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        zoom_user_id = ""
        zoom_email = ""
        if user_resp.status_code == 200:
            user_info = user_resp.json()
            zoom_user_id = user_info.get("id", "")
            zoom_email = user_info.get("email", "")

    # Store in InsForge
    db = _get_db()
    await db.save_zoom_token({
        "user_label": "default",
        "access_token": access_token,
        "refresh_token": token_data.get("refresh_token", ""),
        "expires_at": expires_at,
        "zoom_user_id": zoom_user_id,
        "zoom_email": zoom_email,
        "scopes": token_data.get("scope", ""),
    })

    logger.info(f"Zoom OAuth connected: {zoom_email}")

    # Redirect to integrations page
    return RedirectResponse("/integrations")


@router.get("/status")
async def zoom_status():
    """Return Zoom connection status."""
    db = _get_db()
    token = await db.get_zoom_token()

    if not token:
        return {"connected": False}

    from server.bot_state import state as bot_state

    count = bot_state.zoom_transcript_count
    return {
        "connected": True,
        "email": token.get("zoom_email", ""),
        "zoom_user_id": token.get("zoom_user_id", ""),
        "expires_at": token.get("expires_at"),
        "connected_at": token.get("connected_at"),
        "transcript_count": count,
        "last_poll": bot_state.zoom_last_poll.isoformat() if bot_state.zoom_last_poll else None,
    }


@router.post("/disconnect")
async def disconnect():
    """Delete Zoom token — disconnects integration."""
    db = _get_db()
    await db.delete_zoom_token()
    logger.info("Zoom OAuth disconnected")

    from server.bot_state import state as bot_state
    bot_state.zoom_enabled = False
    bot_state.zoom_email = ""

    return {"status": "disconnected"}
