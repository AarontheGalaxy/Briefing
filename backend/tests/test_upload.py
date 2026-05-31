import pytest


@pytest.mark.asyncio
async def test_upload_txt(client):
    content = b"Meeting notes: we decided to launch next Friday."
    response = await client.post(
        "/api/upload",
        files={"file": ("notes.txt", content, "text/plain")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["file_name"] == "notes.txt"
    assert data["word_count"] > 0
    assert "Meeting notes" in data["text"]


@pytest.mark.asyncio
async def test_upload_unsupported_extension(client):
    response = await client.post(
        "/api/upload",
        files={"file": ("notes.exe", b"binary", "application/octet-stream")},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_upload_oversized_file(client):
    big = b"a" * (51 * 1024 * 1024)  # 51 MB
    response = await client.post(
        "/api/upload",
        files={"file": ("big.txt", big, "text/plain")},
        headers={"content-length": str(len(big))},
    )
    assert response.status_code == 413


@pytest.mark.asyncio
async def test_upload_non_utf8_txt(client):
    # Latin-1 encoded text — should not crash
    content = "Réunion d'équipe".encode("latin-1")
    response = await client.post(
        "/api/upload",
        files={"file": ("reunion.txt", content, "text/plain")},
    )
    assert response.status_code == 200
    assert response.json()["word_count"] > 0
