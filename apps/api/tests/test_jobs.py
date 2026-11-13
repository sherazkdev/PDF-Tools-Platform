import io

from fastapi.testclient import TestClient

from pdf_tools_api.jobs.states import JobStatus
from pdf_tools_api.jobs.store import get_job_store


def _multipart_file(name: str, content: bytes, content_type: str = "application/octet-stream"):
    return ("files", (name, io.BytesIO(content), content_type))


def test_create_job_test_fixture_success(client: TestClient) -> None:
    payload = [
        ("converter_id", (None, "test-fixture")),
        _multipart_file("sample.bin", b"forgepdf-test-bytes", "application/octet-stream"),
    ]
    response = client.post("/api/v1/jobs", files=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "completed"
    assert "access_token" in body
    job_id = body["job_id"]
    token = body["access_token"]

    detail = client.get(f"/api/v1/jobs/{job_id}", headers={"X-Job-Access-Token": token})
    assert detail.status_code == 200
    assert detail.json()["output_files"]

    download = client.get(
        f"/api/v1/jobs/{job_id}/download",
        headers={"X-Job-Access-Token": token},
    )
    assert download.status_code == 200
    assert download.content == b"forgepdf-test-bytes"


def test_unknown_converter(client: TestClient) -> None:
    response = client.post(
        "/api/v1/jobs",
        files=[
            ("converter_id", (None, "unknown-tool")),
            _multipart_file("a.bin", b"x"),
        ],
    )
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "unknown_converter"


def test_planned_converter_not_implemented(client: TestClient) -> None:
    response = client.post(
        "/api/v1/jobs",
        files=[
            ("converter_id", (None, "jpg-to-pdf")),
            _multipart_file("a.jpg", b"\xff\xd8\xff\xe0" + b"0" * 100, "image/jpeg"),
        ],
    )
    assert response.status_code == 501
    assert response.json()["error"]["code"] == "converter_not_implemented"


def test_empty_file_rejected(client: TestClient) -> None:
    response = client.post(
        "/api/v1/jobs",
        files=[
            ("converter_id", (None, "test-fixture")),
            _multipart_file("empty.bin", b"", "application/octet-stream"),
        ],
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "empty_file"


def test_signature_mismatch(client: TestClient) -> None:
    response = client.post(
        "/api/v1/jobs",
        files=[
            ("converter_id", (None, "test-fixture")),
            _multipart_file("fake.jpg", b"not-a-jpeg", "image/jpeg"),
        ],
    )
    assert response.status_code == 400
    code = response.json()["error"]["code"]
    assert code in {"signature_mismatch", "unsupported_format", "mime_mismatch"}


def test_missing_access_token(client: TestClient) -> None:
    payload = [
        ("converter_id", (None, "test-fixture")),
        _multipart_file("sample.bin", b"hello"),
    ]
    created = client.post("/api/v1/jobs", files=payload).json()
    response = client.get(f"/api/v1/jobs/{created['job_id']}")
    assert response.status_code == 401


def test_invalid_access_token(client: TestClient) -> None:
    payload = [
        ("converter_id", (None, "test-fixture")),
        _multipart_file("sample.bin", b"hello"),
    ]
    created = client.post("/api/v1/jobs", files=payload).json()
    response = client.get(
        f"/api/v1/jobs/{created['job_id']}",
        headers={"X-Job-Access-Token": "wrong-token"},
    )
    assert response.status_code == 403


def test_failed_job_download(client: TestClient, monkeypatch) -> None:
    from pdf_tools_api.converters.test_fixture import TestFixtureConverter
    from pdf_tools_api.core.exceptions import AppError

    def fail_convert(self, context):  # noqa: ANN001
        raise AppError("conversion_failed", "Intentional test failure.", status_code=500)

    monkeypatch.setattr(TestFixtureConverter, "convert", fail_convert)
    payload = [
        ("converter_id", (None, "test-fixture")),
        _multipart_file("sample.bin", b"data"),
    ]
    created = client.post("/api/v1/jobs", files=payload).json()
    assert created["status"] == "failed"
    response = client.get(
        f"/api/v1/jobs/{created['job_id']}/download",
        headers={"X-Job-Access-Token": created["access_token"]},
    )
    assert response.status_code == 409


def test_expired_job(client: TestClient) -> None:
    payload = [
        ("converter_id", (None, "test-fixture")),
        _multipart_file("sample.bin", b"data"),
    ]
    created = client.post("/api/v1/jobs", files=payload).json()
    store = get_job_store()
    record = store.get(created["job_id"])
    store.transition(record.job_id, JobStatus.EXPIRED, from_status=record.status)
    record = store.get(created["job_id"])
    assert record.status == JobStatus.EXPIRED

    response = client.get(
        f"/api/v1/jobs/{created['job_id']}/download",
        headers={"X-Job-Access-Token": created["access_token"]},
    )
    assert response.status_code == 410
