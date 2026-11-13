from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from pdf_tools_api.jobs.states import JobStatus


class FileMetadata(BaseModel):
    stored_name: str
    original_name: str
    size_bytes: int
    content_type: str | None = None


class JobCreateResponse(BaseModel):
    job_id: str
    access_token: str = Field(
        description="Present only once at creation; required for status and download via header."
    )
    status: JobStatus
    converter_id: str
    expires_at: datetime


class JobDetailResponse(BaseModel):
    job_id: str
    converter_id: str
    status: JobStatus
    created_at: datetime
    updated_at: datetime
    expires_at: datetime
    input_files: list[FileMetadata]
    output_files: list[FileMetadata]
    settings: dict[str, Any]
    error_code: str | None = None
    error_message: str | None = None


def job_to_response(
    record: Any,
    *,
    include_token: str | None = None,
) -> JobCreateResponse | JobDetailResponse:
    files_in = [FileMetadata(**f.to_dict()) for f in record.input_files]
    files_out = [FileMetadata(**f.to_dict()) for f in record.output_files]
    if include_token is not None:
        return JobCreateResponse(
            job_id=record.job_id,
            access_token=include_token,
            status=record.status,
            converter_id=record.converter_id,
            expires_at=record.expires_at,
        )
    return JobDetailResponse(
        job_id=record.job_id,
        converter_id=record.converter_id,
        status=record.status,
        created_at=record.created_at,
        updated_at=record.updated_at,
        expires_at=record.expires_at,
        input_files=files_in,
        output_files=files_out,
        settings=record.settings,
        error_code=record.error_code,
        error_message=record.error_message,
    )
