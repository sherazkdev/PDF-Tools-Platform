import json
import sqlite3
import threading
from datetime import UTC, datetime
from pathlib import Path

from pdf_tools_api.core.exceptions import AppError
from pdf_tools_api.jobs.models import JobRecord, StoredFileMeta
from pdf_tools_api.jobs.states import JobStatus, assert_transition


class JobStore:
    """SQLite-backed job persistence for local/dev; migrate to shared DB in production."""

    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path, timeout=30, isolation_level=None)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS jobs (
                    job_id TEXT PRIMARY KEY,
                    converter_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    access_token_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    input_files TEXT NOT NULL,
                    output_files TEXT NOT NULL,
                    settings TEXT NOT NULL,
                    error_code TEXT,
                    error_message TEXT
                )
                """
            )

    def _row_to_record(self, row: sqlite3.Row) -> JobRecord:
        return JobRecord(
            job_id=row["job_id"],
            converter_id=row["converter_id"],
            status=JobStatus(row["status"]),
            access_token_hash=row["access_token_hash"],
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
            expires_at=datetime.fromisoformat(row["expires_at"]),
            input_files=[StoredFileMeta.from_dict(i) for i in json.loads(row["input_files"])],
            output_files=[StoredFileMeta.from_dict(i) for i in json.loads(row["output_files"])],
            settings=json.loads(row["settings"]),
            error_code=row["error_code"],
            error_message=row["error_message"],
        )

    def create(self, record: JobRecord) -> None:
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                INSERT INTO jobs (
                    job_id, converter_id, status, access_token_hash,
                    created_at, updated_at, expires_at,
                    input_files, output_files, settings, error_code, error_message
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record.job_id,
                    record.converter_id,
                    record.status.value,
                    record.access_token_hash,
                    record.created_at.isoformat(),
                    record.updated_at.isoformat(),
                    record.expires_at.isoformat(),
                    json.dumps([f.to_dict() for f in record.input_files]),
                    json.dumps([f.to_dict() for f in record.output_files]),
                    json.dumps(record.settings),
                    record.error_code,
                    record.error_message,
                ),
            )

    def get(self, job_id: str) -> JobRecord:
        with self._lock, self._connect() as conn:
            row = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
        if row is None:
            raise AppError("job_not_found", "Job not found.", status_code=404)
        return self._row_to_record(row)

    def transition(
        self,
        job_id: str,
        new_status: JobStatus,
        *,
        output_files: list[StoredFileMeta] | None = None,
        error_code: str | None = None,
        error_message: str | None = None,
        from_status: JobStatus | None = None,
    ) -> JobRecord:
        with self._lock, self._connect() as conn:
            row = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
            if row is None:
                raise AppError("job_not_found", "Job not found.", status_code=404)
            current = JobStatus(row["status"])
            if from_status is not None and current != from_status:
                raise AppError(
                    "job_conflict",
                    "Job state changed concurrently; retry the operation.",
                    status_code=409,
                )
            assert_transition(current, new_status)
            now = datetime.now(UTC)
            outputs_json = row["output_files"]
            if output_files is not None:
                outputs_json = json.dumps([f.to_dict() for f in output_files])
            conn.execute(
                """
                UPDATE jobs
                SET status = ?, updated_at = ?, output_files = ?,
                    error_code = ?, error_message = ?
                WHERE job_id = ? AND status = ?
                """,
                (
                    new_status.value,
                    now.isoformat(),
                    outputs_json,
                    error_code,
                    error_message,
                    job_id,
                    current.value,
                ),
            )
            if conn.total_changes == 0:
                raise AppError(
                    "job_conflict",
                    "Job state changed concurrently; retry the operation.",
                    status_code=409,
                )
            row = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
        return self._row_to_record(row)  # type: ignore[arg-type]

    def list_expired(self, now: datetime) -> list[str]:
        with self._lock, self._connect() as conn:
            rows = conn.execute(
                "SELECT job_id FROM jobs WHERE expires_at <= ? AND status != ?",
                (now.isoformat(), JobStatus.EXPIRED.value),
            ).fetchall()
        return [r["job_id"] for r in rows]


_store: JobStore | None = None


def get_job_store() -> JobStore:
    global _store
    if _store is None:
        from pdf_tools_api.core.config import get_settings

        settings = get_settings()
        meta_dir = Path(settings.storage_root) / "_meta"
        _store = JobStore(meta_dir / "jobs.db")
    return _store


def reset_job_store(db_path: Path | None = None) -> None:
    global _store
    _store = None
    if db_path and db_path.exists():
        db_path.unlink()
