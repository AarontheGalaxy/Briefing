from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from slowapi import Limiter
from slowapi.util import get_remote_address

from config import settings
from models import UploadResponse
from services.extractor import MAX_FILE_SIZE_BYTES, extract_text

SUPPORTED_EXTENSIONS = {"pdf", "docx", "txt", "md"}

router = APIRouter(prefix="/api", tags=["upload"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/upload", response_model=UploadResponse)
@limiter.limit("20/minute")
async def upload_file(request: Request, file: UploadFile = File(...)) -> UploadResponse:  # noqa: ARG001
    filename = file.filename or "unknown"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported.")

    # Read with a hard cap: one byte over the limit means we reject immediately
    content = await file.read(MAX_FILE_SIZE_BYTES + 1)
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {settings.max_file_size_mb}MB limit.",
        )

    try:
        text, word_count = await extract_text(content, filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return UploadResponse(text=text, word_count=word_count, file_name=filename)
