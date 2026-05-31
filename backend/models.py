from typing import Optional
from pydantic import BaseModel, field_validator


class UploadResponse(BaseModel):
    text: str
    word_count: int
    file_name: str


class ActionItem(BaseModel):
    task: str
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    priority: str = "medium"


class AnalyzeRequest(BaseModel):
    text: str
    provider: str = "ollama"
    model: str = "llama3.1"
    api_key: Optional[str] = None
    meeting_type: str = "general"

    @field_validator("text")
    @classmethod
    def text_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("text must not be empty or whitespace")
        return v

    @field_validator("meeting_type")
    @classmethod
    def meeting_type_must_be_valid(cls, v: str) -> str:
        allowed = {"general", "sales", "one_on_one", "sprint_review", "board"}
        if v not in allowed:
            raise ValueError(f"meeting_type must be one of {sorted(allowed)}")
        return v


class AnalysisResponse(BaseModel):
    id: str
    summary: str
    key_decisions: list[str]
    action_items: list[ActionItem]
    participants: list[str]
    topics_discussed: list[str]
    next_meeting: Optional[str]
    sentiment: str
    created_at: str
    word_count: int
    processing_time_ms: int
    file_name: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    completed_items: list[int] = []
    tags: list[str] = []


class UpdateCompletedItemsRequest(BaseModel):
    completed: list[int]


class UpdateTagsRequest(BaseModel):
    tags: list[str]


class HistoryListResponse(BaseModel):
    items: list[AnalysisResponse]
    total: int
    page: int
    limit: int


class TestConnectionRequest(BaseModel):
    provider: str
    model: str
    api_key: Optional[str] = None
    ollama_url: Optional[str] = None


class TestConnectionResponse(BaseModel):
    success: bool
    message: str


class ModelsResponse(BaseModel):
    models: list[str]
