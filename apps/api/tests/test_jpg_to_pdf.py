import io
import json
from pathlib import Path

from fastapi.testclient import TestClient
from pypdf import PdfReader

from tests.helpers.images import write_jpeg


def _job_files(converter_id: str, paths: list[Path], settings: dict | None = None):
    payload: list = [("converter_id", (None, converter_id))]
    for p in paths:
        payload.append(
            (
                "files",
                (p.name, p.read_bytes(), "image/jpeg"),
            ),
        )
    if settings is not None:
        payload.append(("settings", (None, json.dumps(settings))))
    return payload


def test_single_jpg_to_pdf(client: TestClient, tmp_path: Path) -> None:
    src = tmp_path / "one.jpg"
    write_jpeg(src, (400, 300))
    response = client.post(
        "/api/v1/jobs",
        files=_job_files("jpg-to-pdf", [src]),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "completed"
    download = client.get(
        f"/api/v1/jobs/{body['job_id']}/download",
        headers={"X-Job-Access-Token": body["access_token"]},
    )
    assert download.status_code == 200
    assert download.headers["content-type"].startswith("application/")
    reader = PdfReader(io.BytesIO(download.content))
    assert len(reader.pages) == 1


def test_multiple_jpg_order_and_pages(client: TestClient, tmp_path: Path) -> None:
    paths = []
    for i, color in enumerate(("red", "green", "blue")):
        p = tmp_path / f"img_{i}.jpg"
        write_jpeg(p, (200 + i * 10, 150), color)
        paths.append(p)
    response = client.post(
        "/api/v1/jobs",
        files=_job_files("jpg-to-pdf", paths, {"page_size": "a4", "orientation": "portrait"}),
    )
    assert response.status_code == 201
    body = response.json()
    download = client.get(
        f"/api/v1/jobs/{body['job_id']}/download",
        headers={"X-Job-Access-Token": body["access_token"]},
    )
    reader = PdfReader(io.BytesIO(download.content))
    assert len(reader.pages) == 3


def test_a4_letter_settings(client: TestClient, tmp_path: Path) -> None:
    src = tmp_path / "page.jpg"
    write_jpeg(src)
    for page_size in ("a4", "letter"):
        response = client.post(
            "/api/v1/jobs",
            files=_job_files(
                "jpg-to-pdf",
                [src],
                {"page_size": page_size, "orientation": "landscape", "margins": "medium"},
            ),
        )
        assert response.status_code == 201


def test_planned_still_blocked(client: TestClient, tmp_path: Path) -> None:
    src = tmp_path / "x.jpg"
    write_jpeg(src)
    response = client.post(
        "/api/v1/jobs",
        files=_job_files("word-to-pdf", [src]),
    )
    assert response.status_code == 501


def test_fake_jpeg_rejected(client: TestClient, tmp_path: Path) -> None:
    bad = tmp_path / "fake.jpg"
    bad.write_bytes(b"not a jpeg")
    response = client.post("/api/v1/jobs", files=_job_files("jpg-to-pdf", [bad]))
    assert response.status_code == 400
