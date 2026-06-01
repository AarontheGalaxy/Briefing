import os
import tempfile
from contextlib import suppress

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Point the app at a temp DB before importing anything that touches config
_db_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.close(_db_fd)
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_db_path}"

from database import init_db  # noqa: E402
from main import app  # noqa: E402


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    await init_db()
    yield
    with suppress(OSError):
        os.unlink(_db_path)


@pytest_asyncio.fixture
async def client():
    """Each test gets a fresh HTTP client but shares the same DB session."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
