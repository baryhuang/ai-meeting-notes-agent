"""Thin async wrapper for InsForge REST API — stores Zoom OAuth tokens and processed-meeting metadata."""

import logging
from datetime import datetime

import httpx

logger = logging.getLogger(__name__)


class InsForgeDB:
    """Async client for InsForge REST API (zoom_tokens + zoom_processed tables)."""

    def __init__(self, base_url: str, anon_key: str):
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
        }
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=30)
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    # ── zoom_tokens ──────────────────────────────────────────────

    async def get_zoom_token(self, user_label: str = "default") -> dict | None:
        client = await self._get_client()
        url = f"{self.base_url}/api/database/records/zoom_tokens?user_label=eq.{user_label}"
        resp = await client.get(url, headers=self.headers)
        resp.raise_for_status()
        rows = resp.json()
        return rows[0] if rows else None

    async def save_zoom_token(self, token_data: dict) -> dict:
        client = await self._get_client()
        url = f"{self.base_url}/api/database/records/zoom_tokens"
        headers = {
            **self.headers,
            "Prefer": "resolution=merge-duplicates,return=representation",
        }
        token_data.setdefault("user_label", "default")
        token_data["updated_at"] = datetime.utcnow().isoformat()
        resp = await client.post(url, headers=headers, json=[token_data])
        resp.raise_for_status()
        rows = resp.json()
        return rows[0] if rows else token_data

    async def delete_zoom_token(self, user_label: str = "default") -> None:
        client = await self._get_client()
        url = f"{self.base_url}/api/database/records/zoom_tokens?user_label=eq.{user_label}"
        resp = await client.delete(url, headers=self.headers)
        resp.raise_for_status()

    # ── zoom_processed ───────────────────────────────────────────

    async def get_processed_uuids(self) -> set[str]:
        client = await self._get_client()
        url = f"{self.base_url}/api/database/records/zoom_processed?select=meeting_uuid"
        resp = await client.get(url, headers=self.headers)
        resp.raise_for_status()
        return {row["meeting_uuid"] for row in resp.json()}

    async def mark_processed(self, meeting: dict, local_path: str) -> None:
        client = await self._get_client()
        url = f"{self.base_url}/api/database/records/zoom_processed"
        headers = {
            **self.headers,
            "Prefer": "resolution=merge-duplicates,return=representation",
        }
        row = {
            "meeting_uuid": meeting["uuid"],
            "meeting_id": str(meeting.get("id", "")),
            "topic": meeting.get("topic", ""),
            "start_time": meeting.get("start_time"),
            "duration": meeting.get("duration"),
            "local_path": local_path,
        }
        resp = await client.post(url, headers=headers, json=[row])
        resp.raise_for_status()

    async def get_processed_meetings(self, limit: int = 50, offset: int = 0) -> list[dict]:
        client = await self._get_client()
        url = (
            f"{self.base_url}/api/database/records/zoom_processed"
            f"?order=processed_at.desc&limit={limit}&offset={offset}"
        )
        resp = await client.get(url, headers=self.headers)
        resp.raise_for_status()
        return resp.json()

    async def get_processed_count(self) -> int:
        client = await self._get_client()
        url = f"{self.base_url}/api/database/records/zoom_processed?select=id"
        headers = {**self.headers, "Prefer": "count=exact"}
        resp = await client.head(url, headers=headers)
        resp.raise_for_status()
        # InsForge returns count in Content-Range header
        content_range = resp.headers.get("content-range", "")
        if "/" in content_range:
            total = content_range.split("/")[-1]
            return int(total) if total != "*" else 0
        # Fallback: fetch all IDs
        resp2 = await client.get(url, headers=self.headers)
        resp2.raise_for_status()
        return len(resp2.json())
