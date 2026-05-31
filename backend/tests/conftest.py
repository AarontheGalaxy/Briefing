import os
import tempfile
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Point the app at a temp DB before importing anything that touches config
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_tmp.name}"

from main import app  # noqa: E402 — must come after env var is set
from database import init_db  # noqa: E402


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    await init_db()
    yield
    os.unlink(_tmp.name)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
