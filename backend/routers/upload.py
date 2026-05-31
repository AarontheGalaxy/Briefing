from fastapi import APIRouter, File, Request, UploadFile, HTTPException
from models import UploadResponse
from services.extractor import extract_text, MAX_FILE_SIZE_BYTES

SUPPORTED_EXTENSIONS = {"pdf", "docx", "txt", "md"}

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload", response_model=UploadResponse)
async def upload_file(request: Request, file: UploadFile = File(...)) -> UploadResponse:
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 50MB limit.")

    filename = file.filename or "unknown"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported.")

    # Read with a hard cap: one byte over the limit means we reject immediately
    content = await file.read(MAX_FILE_SIZE_BYTES + 1)
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 50MB limit.")

    try:
        text, word_count = await extract_text(content, filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return UploadResponse(text=text, word_count=word_count, file_name=filename)
