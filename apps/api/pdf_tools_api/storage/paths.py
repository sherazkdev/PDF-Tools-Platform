import re
from pathlib import Path

from pdf_tools_api.core.exceptions import AppError

_JOB_ID_PATTERN = re.compile(r"^[a-f0-9]{32}$")


def validate_job_id(job_id: str) -> str:
    job_id = job_id.strip().lower()
    if not _JOB_ID_PATTERN.match(job_id):
        raise AppError("invalid_job_id", "Invalid job identifier.", status_code=400)
    return job_id


def job_root(storage_root: Path, job_id: str) -> Path:
    job_id = validate_job_id(job_id)
    root = storage_root.resolve()
    job_dir = (root / job_id).resolve()
    if not str(job_dir).startswith(str(root)):
        raise AppError("invalid_path", "Invalid storage path.", status_code=400)
    return job_dir


def input_dir(storage_root: Path, job_id: str) -> Path:
    return job_root(storage_root, job_id) / "input"


def output_dir(storage_root: Path, job_id: str) -> Path:
    return job_root(storage_root, job_id) / "output"


def resolve_stored_file(storage_root: Path, job_id: str, stored_name: str, *, output: bool) -> Path:
    if "/" in stored_name or "\\" in stored_name or stored_name in (".", ".."):
        raise AppError("invalid_path", "Invalid file reference.", status_code=400)
    base = output_dir(storage_root, job_id) if output else input_dir(storage_root, job_id)
    target = (base / stored_name).resolve()
    if not str(target).startswith(str(base.resolve())):
        raise AppError("invalid_path", "Path traversal rejected.", status_code=400)
    return target
