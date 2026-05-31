import json
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from database import db_connection
from models import AnalysisResponse, ActionItem, HistoryListResponse

router = APIRouter(prefix="/api", tags=["history"])


def _row_to_analysis(row: dict) -> AnalysisResponse:
    action_items_raw = json.loads(row["action_items"] or "[]")
    action_items = [
        ActionItem(
            task=item.get("task", ""),
            assignee=item.get("assignee"),
            due_date=item.get("due_date"),
            priority=item.get("priority", "medium"),
        )
        for item in action_items_raw
    ]
    return AnalysisResponse(
        id=row["id"],
        summary=row["summary"] or "",
        key_decisions=json.loads(row["key_decisions"] or "[]"),
        action_items=action_items,
        participants=json.loads(row["participants"] or "[]"),
        topics_discussed=json.loads(row["topics_discussed"] or "[]"),
        next_meeting=row["next_meeting"],
        sentiment=row["sentiment"] or "neutral",
        created_at=row["created_at"],
        word_count=row["word_count"] or 0,
        processing_time_ms=row["processing_time_ms"] or 0,
        file_name=row["file_name"],
        provider=row["provider"],
        model=row["model"],
    )


@router.get("/history", response_model=HistoryListResponse)
async def list_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> HistoryListResponse:
    offset = (page - 1) * limit
    async with db_connection() as db:
        async with db.execute("SELECT COUNT(*) FROM analyses") as cursor:
            total_row = await cursor.fetchone()
            total = total_row[0] if total_row else 0

        async with db.execute(
            "SELECT * FROM analyses ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ) as cursor:
            rows = await cursor.fetchall()

    items = [_row_to_analysis(dict(row)) for row in rows]
    return HistoryListResponse(items=items, total=total, page=page, limit=limit)


@router.get("/history/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: UUID) -> AnalysisResponse:
    async with db_connection() as db:
        async with db.execute(
            "SELECT * FROM analyses WHERE id = ?", (str(analysis_id),)
        ) as cursor:
            row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    return _row_to_analysis(dict(row))


@router.delete("/history/{analysis_id}")
async def delete_analysis(analysis_id: UUID) -> dict:
    async with db_connection() as db:
        async with db.execute(
            "SELECT id FROM analyses WHERE id = ?", (str(analysis_id),)
        ) as cursor:
            row = await cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Analysis not found.")

        await db.execute("DELETE FROM analyses WHERE id = ?", (str(analysis_id),))
        await db.commit()

    return {"deleted": True}
