import io
import json
import zipfile
from pathlib import Path

from fastapi.testclient import TestClient
from PIL import Image

from tests.helpers.pdf import write_multipage_pdf


def _job_pdf(client: TestClient, pdf: Path, settings: dict | None = None):
    payload: list = [
        ("converter_id", (None, "pdf-to-jpg")),
        ("files", (pdf.name, pdf.read_bytes(), "application/pdf")),
    ]
    if settings:
        payload.append(("settings", (None, json.dumps(settings))))
    return client.post("/api/v1/jobs", files=payload)


def test_single_page_jpg(client: TestClient, tmp_path: Path) -> None:
    pdf = tmp_path / "one.pdf"
    write_multipage_pdf(pdf, pages=3)
    response = _job_pdf(
        client,
        pdf,
        {"page_mode": "custom", "page_range": "2", "dpi": "150", "jpeg_quality": "high"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "completed"
    dl = client.get(
        f"/api/v1/jobs/{body['job_id']}/download",
        headers={"X-Job-Access-Token": body["access_token"]},
    )
    assert dl.status_code == 200
    assert "image" in dl.headers.get("content-type", "")
    im = Image.open(io.BytesIO(dl.content))
    assert im.format == "JPEG"
    assert im.width > 100


def test_multi_page_zip(client: TestClient, tmp_path: Path) -> None:
    pdf = tmp_path / "multi.pdf"
    write_multipage_pdf(pdf, pages=3)
    response = _job_pdf(
        client,
        pdf,
        {"page_mode": "custom", "page_range": "1,3", "dpi": "72", "jpeg_quality": "standard"},
    )
    assert response.status_code == 201
    body = response.json()
    dl = client.get(
        f"/api/v1/jobs/{body['job_id']}/download",
        headers={"X-Job-Access-Token": body["access_token"]},
    )
    assert dl.status_code == 200
    assert "zip" in dl.headers.get("content-type", "").lower() or dl.content[:2] == b"PK"
    with zipfile.ZipFile(io.BytesIO(dl.content)) as zf:
        names = sorted(zf.namelist())
        assert len(names) == 2
        for name in names:
            data = zf.read(name)
            im = Image.open(io.BytesIO(data))
            assert im.format == "JPEG"


def test_dpi_changes_dimensions(client: TestClient, tmp_path: Path) -> None:
    pdf = tmp_path / "dims.pdf"
    write_multipage_pdf(pdf, pages=1, width=72, height=72)
    low = _job_pdf(client, pdf, {"page_mode": "all", "dpi": "72", "jpeg_quality": "high"})
    high = _job_pdf(client, pdf, {"page_mode": "all", "dpi": "300", "jpeg_quality": "high"})
    assert low.status_code == 201 and high.status_code == 201
    low_im = Image.open(io.BytesIO(client.get(
        f"/api/v1/jobs/{low.json()['job_id']}/download",
        headers={"X-Job-Access-Token": low.json()["access_token"]},
    ).content))
    high_im = Image.open(io.BytesIO(client.get(
        f"/api/v1/jobs/{high.json()['job_id']}/download",
        headers={"X-Job-Access-Token": high.json()["access_token"]},
    ).content))
    assert high_im.width > low_im.width * 3


def test_inspect_endpoint(client: TestClient, tmp_path: Path) -> None:
    pdf = tmp_path / "inspect.pdf"
    write_multipage_pdf(pdf, pages=5)
    response = client.post(
        "/api/v1/tools/pdf-to-jpg/inspect",
        files={"file": (pdf.name, pdf.read_bytes(), "application/pdf")},
    )
    assert response.status_code == 200
    assert response.json()["page_count"] == 5
