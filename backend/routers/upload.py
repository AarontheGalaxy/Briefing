from fastapi import APIRouter, File, UploadFile, HTTPException
from models import UploadResponse
from services.extractor import extract_text

SUPPORTED_EXTENSIONS = {"pdf", "docx", "txt", "md"}

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)) -> UploadResponse:
    filename = file.filename or "unknown"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported.")

    content = await file.read()

    try:
        text, word_count = await extract_text(content, filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return UploadResponse(text=text, word_count=word_count, file_name=filename)
