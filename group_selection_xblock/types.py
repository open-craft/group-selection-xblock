"""
Pydantic models for the Group Selection XBlock.

These are the canonical data schema — XBlock fields store serialized dicts,
and model_validate() / model_dump() bridge between the two.
"""

from typing import Optional

from pydantic import BaseModel


class Choice(BaseModel):
    """A single choice option presented to the learner."""
    id: str
    text: str


class ContentGroup(BaseModel):
    """A content group available in the course."""
    partition_id: int
    group_id: int
    name: str


class SelectionData(BaseModel):
    """The learner's current selection, read from the plugin."""
    choice_id: str
    content_group_id: int
    cohort_id: Optional[int] = None
    created: str  # ISO datetime
    modified: str  # ISO datetime
    can_change: bool


class LearnerInitData(BaseModel):
    """Data passed to the learner view React app."""
    block_id: str
    question_text: str
    choices: list[Choice]
    selection: Optional[SelectionData] = None
    allow_change: bool
    handler_urls: dict[str, str]


class StudioInitData(BaseModel):
    """Data passed to the Studio editor React app."""
    block_id: str
    question_text: str
    choices: list[Choice]
    choice_group_partition_map: dict[str, dict[str, int]]
    allow_change: bool
    content_groups: list[ContentGroup]
    handler_urls: dict[str, str]


class StudioSaveData(BaseModel, extra="forbid"):
    """Validates data received from the Studio editor on save."""
    question_text: str
    choices: list[Choice]
    choice_group_partition_map: dict[str, dict[str, int]]
    allow_change: bool


class SubmitSelectionRequest(BaseModel, extra="forbid"):
    """Validates selection data received from the learner."""
    choice_id: str
