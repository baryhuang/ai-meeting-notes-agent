"""Async polling loop — pulls new Zoom transcripts and saves them as local files + S3."""

import asyncio
import json
import logging
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Callable

from server.bot_state import state as bot_state
from server.src.zoom.client import ZoomClient
from server.src.zoom.insforge_db import InsForgeDB

logger = logging.getLogger(__name__)


def _sanitize_filename(name: str) -> str:
    """Convert a meeting topic into a safe directory name."""
    name = re.sub(r'[<>:"/\\|?*]', '_', name)
    name = re.sub(r'\s+', '-', name.strip())
    return name[:100] or "untitled"


async def zoom_poll_loop(
    zoom_client: ZoomClient,
    insforge_db: InsForgeDB,
    data_dir: Path,
    bot_name: str,
    save_file_fn: Callable | None = None,
    poll_interval: int = 300,
):
    """Continuously poll Zoom for new transcripts.

    Args:
        zoom_client: Authenticated ZoomClient instance.
        insforge_db: InsForge DB client for dedup tracking.
        data_dir: Root data directory (e.g. ./data).
        bot_name: Bot name prefix for storage paths.
        save_file_fn: Optional fn(prefix, filename, data_bytes) for S3 sync.
        poll_interval: Seconds between polls (default 5 min).
    """
    logger.info(f"Zoom poller started (interval={poll_interval}s)")

    while True:
        try:
            # Load/refresh token
            if not await zoom_client.load_token():
                logger.warning("Zoom token not found — poller pausing")
                await asyncio.sleep(poll_interval)
                continue

            # List recordings from last 7 days
            from_date = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
            recordings = await zoom_client.list_recordings(from_date=from_date)

            meetings = recordings.get("meetings", [])
            if not meetings:
                logger.debug("No Zoom recordings found in last 7 days")
                bot_state.zoom_last_poll = datetime.now()
                await asyncio.sleep(poll_interval)
                continue

            # Get already-processed UUIDs
            processed = await insforge_db.get_processed_uuids()

            new_count = 0
            for meeting in meetings:
                meeting_uuid = meeting.get("uuid", "")
                if not meeting_uuid or meeting_uuid in processed:
                    continue

                meeting_id = meeting.get("id", "")
                topic = meeting.get("topic", "untitled")

                # Download transcript
                transcript = await zoom_client.get_meeting_transcript(meeting_id)
                if not transcript:
                    logger.debug(f"No transcript for meeting {topic} ({meeting_uuid})")
                    continue

                # Build local path: data/{bot_name}/zoom/{YYYY-MM-DD}/{topic}/
                start_time = meeting.get("start_time", "")
                date_str = start_time[:10] if start_time else datetime.utcnow().strftime("%Y-%m-%d")
                safe_topic = _sanitize_filename(topic)
                local_dir = data_dir / bot_name / "zoom" / date_str / safe_topic
                local_dir.mkdir(parents=True, exist_ok=True)

                # Write transcript VTT
                vtt_path = local_dir / "transcript.vtt"
                vtt_path.write_text(transcript["content"], encoding="utf-8")

                # Write metadata JSON
                meta = {
                    "topic": topic,
                    "start_time": start_time,
                    "duration": meeting.get("duration"),
                    "meeting_id": str(meeting_id),
                    "uuid": meeting_uuid,
                    "pulled_at": datetime.utcnow().isoformat(),
                }
                meta_path = local_dir / "metadata.json"
                meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")

                logger.info(f"Saved Zoom transcript: {local_dir}")

                # Sync to S3 using existing _save_file pattern
                if save_file_fn:
                    prefix = f"{bot_name}/zoom/{date_str}/{safe_topic}"
                    save_file_fn(prefix, "transcript.vtt", transcript["content"].encode("utf-8"))
                    save_file_fn(prefix, "metadata.json", meta_path.read_bytes())

                # Mark processed in InsForge
                await insforge_db.mark_processed(meeting, local_path=str(local_dir))

                new_count += 1
                bot_state.zoom_transcript_count += 1

            if new_count:
                logger.info(f"Zoom poller: pulled {new_count} new transcript(s)")
                bot_state.record_activity()

            bot_state.zoom_last_poll = datetime.now()

        except Exception as e:
            logger.error(f"Zoom poll error: {e}", exc_info=True)
            bot_state.record_error(f"Zoom: {str(e)[:200]}")

        await asyncio.sleep(poll_interval)
