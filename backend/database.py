import aiosqlite
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from config import settings

DB_PATH = settings.db_path


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


@asynccontextmanager
async def db_connection() -> AsyncGenerator[aiosqlite.Connection, None]:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()


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
        # Additive migration — safe to run on existing databases
        try:
            await db.execute(
                "ALTER TABLE analyses ADD COLUMN completed_items TEXT DEFAULT '[]'"
            )
        except Exception:
            pass  # column already exists
        await db.commit()
