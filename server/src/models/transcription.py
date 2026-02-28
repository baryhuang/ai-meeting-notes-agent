#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
TranscriptionSegment model class for representing transcription segments.
"""

from typing import List, Dict, Any, Optional


class TranscriptionSegment:
    """Represents a transcription segment with timing information and word-level timestamps"""
    def __init__(self, text: str, start: float, end: float, words: Optional[List[Dict[str, Any]]] = None, speaker: Optional[str] = None):
        self.text = text
        self.start = start
        self.end = end
        self.duration = end - start
        self.words = words or []
        self.speaker = speaker

    def __str__(self):
        speaker_info = f"[Speaker {self.speaker}] " if self.speaker else ""
        return f"{self.start:.2f}s - {self.end:.2f}s: {speaker_info}{self.text}"
