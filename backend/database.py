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
        except aiosqlite.OperationalError:
            pass  # column already exists

        try:
            await db.execute(
                "ALTER TABLE analyses ADD COLUMN tags TEXT DEFAULT '[]'"
            )
        except aiosqlite.OperationalError:
            pass  # column already exists

        # FTS5 virtual table for full-text search
        await db.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS analyses_fts USING fts5(
                summary,
                file_name,
                key_decisions,
                topics_discussed,
                participants,
                content='analyses',
                content_rowid='rowid',
                tokenize='unicode61'
            )
        """)

        # Triggers to keep FTS index in sync with main table
        await db.execute("""
            CREATE TRIGGER IF NOT EXISTS analyses_ai
            AFTER INSERT ON analyses BEGIN
                INSERT INTO analyses_fts(rowid, summary, file_name, key_decisions,
                                         topics_discussed, participants)
                VALUES (new.rowid, new.summary, new.file_name, new.key_decisions,
                        new.topics_discussed, new.participants);
            END
        """)
        await db.execute("""
            CREATE TRIGGER IF NOT EXISTS analyses_ad
            AFTER DELETE ON analyses BEGIN
                INSERT INTO analyses_fts(analyses_fts, rowid, summary, file_name,
                                         key_decisions, topics_discussed, participants)
                VALUES ('delete', old.rowid, old.summary, old.file_name, old.key_decisions,
                        old.topics_discussed, old.participants);
            END
        """)
        await db.execute("""
            CREATE TRIGGER IF NOT EXISTS analyses_au
            AFTER UPDATE ON analyses BEGIN
                INSERT INTO analyses_fts(analyses_fts, rowid, summary, file_name,
                                         key_decisions, topics_discussed, participants)
                VALUES ('delete', old.rowid, old.summary, old.file_name, old.key_decisions,
                        old.topics_discussed, old.participants);
                INSERT INTO analyses_fts(rowid, summary, file_name, key_decisions,
                                         topics_discussed, participants)
                VALUES (new.rowid, new.summary, new.file_name, new.key_decisions,
                        new.topics_discussed, new.participants);
            END
        """)

        # Populate FTS for any pre-existing rows (safe to run multiple times)
        await db.execute("INSERT OR IGNORE INTO analyses_fts(analyses_fts) VALUES('rebuild')")

        # Generic key-value store for app settings (e.g. webhook_url)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)

        await db.commit()
