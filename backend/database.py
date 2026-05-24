import aiosqlite
import os

DB_PATH = "meetings.db"


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                file_name TEXT,
                word_count INTEGER,
                summary TEXT,
                key_decisions TEXT,
                action_items TEXT,
                participants TEXT,
                topics_discussed TEXT,
                next_meeting TEXT,
                sentiment TEXT,
                provider TEXT,
                model TEXT,
                processing_time_ms INTEGER,
                created_at TEXT
            )
        """)
        await db.commit()
