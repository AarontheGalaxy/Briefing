from pydantic import BaseModel, field_validator


class UploadResponse(BaseModel):
    text: str
    word_count: int
    file_name: str


class ActionItem(BaseModel):
    task: str
    assignee: str | None = None
    due_date: str | None = None
    priority: str = "medium"


class AnalyzeRequest(BaseModel):
    text: str
    provider: str = "ollama"
    model: str = "llama3.1"
    api_key: str | None = None
    meeting_type: str = "general"
    file_name: str | None = None

    @field_validator("text")
    @classmethod
    def text_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("text must not be empty or whitespace")
        if len(v) > 200_000:
            raise ValueError("text is too long (max 200,000 chars)")
        return v

    @field_validator("model")
    @classmethod
    def validate_model_name(cls, v: str) -> str:
        import re
        if not re.match(r"^[a-zA-Z0-9._:/-]{1,200}$", v) or ".." in v or v.startswith("/"):
            raise ValueError("Invalid model name")
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
    next_meeting: str | None
    sentiment: str
    created_at: str
    word_count: int
    processing_time_ms: int
    file_name: str | None = None
    provider: str | None = None
    model: str | None = None
    completed_items: list[int] = []
    tags: list[str] = []


class UpdateCompletedItemsRequest(BaseModel):
    completed: list[int]

    @field_validator("completed")
    @classmethod
    def validate_completed(cls, v: list[int]) -> list[int]:
        if len(v) > 200:
            raise ValueError("Too many completed items")
        if any(i < 0 for i in v):
            raise ValueError("Indices must be non-negative")
        return v


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
    api_key: str | None = None
    ollama_url: str | None = None


class TestConnectionResponse(BaseModel):
    success: bool
    message: str


class ModelsResponse(BaseModel):
    models: list[str]
