"""Shared state singleton for the bot — read by the API server."""

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class BotState:
    started_at: datetime | None = None
    bot_name: str = ""

    # Module status
    ai_enabled: bool = False
    glm_enabled: bool = False
    s3_enabled: bool = False
    s3_bucket: str = ""
    openai_model: str = ""
    glm_model: str = ""
    anthropic_base_url: str = ""

    # Zoom integration
    zoom_enabled: bool = False
    zoom_email: str = ""
    zoom_transcript_count: int = 0
    zoom_last_poll: datetime | None = None

    # Counters (incremented by handlers)
    transcription_count: int = 0
    chat_count: int = 0
    file_count: int = 0
    last_activity: datetime | None = None

    # Recent errors — kept as a bounded list
    recent_errors: list[dict] = field(default_factory=list)

    def record_error(self, message: str):
        self.recent_errors.append({
            "timestamp": datetime.now().isoformat(),
            "message": message,
        })
        # Keep only the last 20
        if len(self.recent_errors) > 20:
            self.recent_errors = self.recent_errors[-20:]

    def record_activity(self):
        self.last_activity = datetime.now()


state = BotState()
