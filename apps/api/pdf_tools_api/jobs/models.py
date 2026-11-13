from dataclasses import dataclass
from datetime import datetime
from typing import Any

from pdf_tools_api.jobs.states import JobStatus


@dataclass
class StoredFileMeta:
    stored_name: str
    original_name: str
    size_bytes: int
    content_type: str | None

    def to_dict(self) -> dict[str, Any]:
        return {
            "stored_name": self.stored_name,
            "original_name": self.original_name,
            "size_bytes": self.size_bytes,
            "content_type": self.content_type,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "StoredFileMeta":
        return cls(
            stored_name=data["stored_name"],
            original_name=data["original_name"],
            size_bytes=int(data["size_bytes"]),
            content_type=data.get("content_type"),
        )


@dataclass
class JobRecord:
    job_id: str
    converter_id: str
    status: JobStatus
    access_token_hash: str
    created_at: datetime
    updated_at: datetime
    expires_at: datetime
    input_files: list[StoredFileMeta]
    output_files: list[StoredFileMeta]
    settings: dict[str, Any]
    error_code: str | None = None
    error_message: str | None = None
