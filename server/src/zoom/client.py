"""Async Zoom API client — list recordings, download transcripts, auto-refresh tokens."""

import base64
import logging
import time

import httpx

from server.src.zoom.insforge_db import InsForgeDB

logger = logging.getLogger(__name__)

ZOOM_API_BASE = "https://api.zoom.us/v2"
ZOOM_OAUTH_TOKEN_URL = "https://zoom.us/oauth/token"


class ZoomClient:
    """Async Zoom API client with token auto-refresh."""

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        insforge_db: InsForgeDB,
        user_label: str = "default",
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.insforge_db = insforge_db
        self.user_label = user_label
        self._access_token: str = ""
        self._expires_at: int = 0
        self._http: httpx.AsyncClient | None = None

    async def _get_http(self) -> httpx.AsyncClient:
        if self._http is None or self._http.is_closed:
            self._http = httpx.AsyncClient(timeout=30)
        return self._http

    async def close(self):
        if self._http and not self._http.is_closed:
            await self._http.aclose()

    def _basic_auth_header(self) -> str:
        creds = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        return f"Basic {creds}"

    async def load_token(self) -> bool:
        """Load token from InsForge DB. Returns True if a valid token exists."""
        token = await self.insforge_db.get_zoom_token(self.user_label)
        if not token:
            return False
        self._access_token = token["access_token"]
        self._expires_at = token["expires_at"]
        return True

    async def refresh_token(self) -> bool:
        """Refresh the access token using the stored refresh token."""
        token = await self.insforge_db.get_zoom_token(self.user_label)
        if not token or not token.get("refresh_token"):
            logger.error("No refresh token available")
            return False

        http = await self._get_http()
        resp = await http.post(
            ZOOM_OAUTH_TOKEN_URL,
            headers={
                "Authorization": self._basic_auth_header(),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "refresh_token",
                "refresh_token": token["refresh_token"],
            },
        )

        if resp.status_code != 200:
            logger.error(f"Token refresh failed: {resp.status_code} {resp.text}")
            return False

        data = resp.json()
        expires_at = int(time.time()) + data.get("expires_in", 3600)

        await self.insforge_db.save_zoom_token({
            "user_label": self.user_label,
            "access_token": data["access_token"],
            "refresh_token": data.get("refresh_token", token["refresh_token"]),
            "expires_at": expires_at,
            "scopes": data.get("scope", token.get("scopes", "")),
        })

        self._access_token = data["access_token"]
        self._expires_at = expires_at
        logger.info("Zoom token refreshed successfully")
        return True

    async def _ensure_token(self):
        """Refresh token if it's about to expire (within 60s)."""
        if time.time() > self._expires_at - 60:
            await self.refresh_token()

    async def _api_get(self, path: str, params: dict | None = None) -> dict:
        await self._ensure_token()
        http = await self._get_http()
        resp = await http.get(
            f"{ZOOM_API_BASE}{path}",
            headers={"Authorization": f"Bearer {self._access_token}"},
            params=params,
        )
        resp.raise_for_status()
        return resp.json()

    async def list_recordings(self, from_date: str, to_date: str | None = None) -> dict:
        """List cloud recordings for the authenticated user.

        Args:
            from_date: Start date in YYYY-MM-DD format.
            to_date: End date in YYYY-MM-DD format (defaults to today).
        """
        params = {"from": from_date, "page_size": "100"}
        if to_date:
            params["to"] = to_date

        result = await self._api_get("/users/me/recordings", params)
        return result

    async def get_meeting_transcript(self, meeting_id: str | int) -> dict | None:
        """Get transcript VTT content for a meeting. Returns None if no transcript exists.

        Returns dict with 'content' (VTT text) and 'download_url' keys, or None.
        """
        try:
            recording = await self._api_get(f"/meetings/{meeting_id}/recordings")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise

        # Find transcript file in recording files
        recording_files = recording.get("recording_files", [])
        transcript_file = None
        for f in recording_files:
            if f.get("file_type") == "TRANSCRIPT" or f.get("recording_type") == "audio_transcript":
                transcript_file = f
                break

        if not transcript_file:
            return None

        download_url = transcript_file.get("download_url")
        if not download_url:
            return None

        # Download the VTT content
        await self._ensure_token()
        http = await self._get_http()
        resp = await http.get(
            download_url,
            headers={"Authorization": f"Bearer {self._access_token}"},
            follow_redirects=True,
        )
        resp.raise_for_status()

        return {
            "content": resp.text,
            "download_url": download_url,
            "file_type": transcript_file.get("file_type", "TRANSCRIPT"),
        }
