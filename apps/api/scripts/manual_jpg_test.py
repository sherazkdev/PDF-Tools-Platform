import io
import json
import os
from pathlib import Path

from fastapi.testclient import TestClient
from pypdf import PdfReader

from pdf_tools_api.api.deps import clear_service_caches
from pdf_tools_api.core.app import create_app
from tests.helpers.images import write_jpeg

os.environ["APP_ENV"] = "test"
os.environ["STORAGE_ROOT"] = str(Path(__file__).resolve().parents[1] / "var" / "storage-test")
clear_service_caches()

tmp = Path(__file__).resolve().parents[2] / "tests" / "fixtures" / "manual"
tmp.mkdir(parents=True, exist_ok=True)
paths: list[Path] = []
for i, color in enumerate(("red", "green", "blue")):
    p = tmp / f"m{i}.jpg"
    write_jpeg(p, (300 + i * 20, 200), color)
    paths.append(p)

payload: list = [
    ("converter_id", (None, "jpg-to-pdf")),
    (
        "settings",
        (None, json.dumps({"page_size": "a4", "orientation": "portrait", "margins": "medium"})),
    ),
]
for p in paths:
    payload.append(("files", (p.name, p.read_bytes(), "image/jpeg")))

client = TestClient(create_app())
response = client.post("/api/v1/jobs", files=payload)
print("http", response.status_code, "status", response.json().get("status"))
body = response.json()
download = client.get(
    f"/api/v1/jobs/{body['job_id']}/download",
    headers={"X-Job-Access-Token": body["access_token"]},
)
reader = PdfReader(io.BytesIO(download.content))
print("pages", len(reader.pages), "bytes", len(download.content))
