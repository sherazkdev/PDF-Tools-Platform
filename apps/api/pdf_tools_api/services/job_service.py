import json
import secrets
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from fastapi import UploadFile

from pdf_tools_api.converters.base import ConversionContext
from pdf_tools_api.converters.registry import ConverterRegistry
from pdf_tools_api.core.config import Settings
from pdf_tools_api.core.exceptions import AppError
from pdf_tools_api.jobs.models import JobRecord, StoredFileMeta
from pdf_tools_api.jobs.states import JobStatus
from pdf_tools_api.jobs.store import JobStore
from pdf_tools_api.security.auth import generate_access_token, hash_access_token
from pdf_tools_api.services.upload_service import UploadService
from pdf_tools_api.storage.paths import input_dir, output_dir
from pdf_tools_api.storage.service import StorageService


class JobService:
    def __init__(
        self,
        settings: Settings,
        store: JobStore,
        storage: StorageService,
        registry: ConverterRegistry,
    ) -> None:
        self._settings = settings
        self._store = store
        self._storage = storage
        self._registry = registry
        self._uploads = UploadService(settings)
        self._active_jobs = 0

    def _now(self) -> datetime:
        return datetime.now(UTC)

    async def create_job_async(
        self,
        converter_id: str,
        files: list[UploadFile],
        settings: dict[str, Any] | None = None,
    ) -> tuple[JobRecord, str]:
        if self._active_jobs >= self._settings.max_concurrent_jobs:
            raise AppError(
                "too_many_jobs",
                "Server is busy processing other conversions. Try again shortly.",
                status_code=503,
            )

        converter = self._registry.get_converter(converter_id)
        settings = self._normalize_settings(converter, settings)
        self._storage.enforce_storage_budget()

        job_id = secrets.token_hex(16)
        self._active_jobs += 1
        access_token = generate_access_token()
        token_hash = hash_access_token(access_token)
        work, inp, out = self._storage.ensure_job_dirs(job_id)

        try:
            input_metas = await self._uploads.save_uploads(files, inp)
            input_paths = [
                input_dir(self._storage.root, job_id) / m.stored_name for m in input_metas
            ]
            converter.validate_inputs(input_paths)
        except Exception:
            self._uploads.remove_partial(work)
            self._active_jobs -= 1
            raise

        now = self._now()
        record = JobRecord(
            job_id=job_id,
            converter_id=converter_id,
            status=JobStatus.QUEUED,
            access_token_hash=token_hash,
            created_at=now,
            updated_at=now,
            expires_at=now + timedelta(seconds=self._settings.job_ttl_seconds),
            input_files=input_metas,
            output_files=[],
            settings=settings or {},
        )
        self._store.create(record)

        try:
            self._process_job(record.job_id, converter)
            updated = self._store.get(job_id)
            return updated, access_token
        finally:
            self._active_jobs -= 1

    def _process_job(self, job_id: str, converter: Any) -> None:
        try:
            self._store.transition(job_id, JobStatus.PROCESSING, from_status=JobStatus.QUEUED)
        except AppError:
            return

        record = self._store.get(job_id)
        work = Path(self._storage.root) / job_id
        inp = input_dir(self._storage.root, job_id)
        out = output_dir(self._storage.root, job_id)
        input_paths = [inp / meta.stored_name for meta in record.input_files]

        context = ConversionContext(
            job_id=job_id,
            work_dir=work,
            input_dir=inp,
            output_dir=out,
            input_paths=input_paths,
            settings=record.settings,
        )

        try:
            outputs = converter.convert(context)
            converter.verify_outputs(outputs)
            output_metas = [
                StoredFileMeta(
                    stored_name=p.name,
                    original_name=(
                        p.name
                        if p.suffix.lower() != ".pdf"
                        else "forgepdf-images.pdf"
                    ),
                    size_bytes=p.stat().st_size,
                    content_type=(
                        "application/pdf"
                        if p.suffix.lower() == ".pdf"
                        else "application/octet-stream"
                    ),
                )
                for p in outputs
            ]
            self._store.transition(
                job_id,
                JobStatus.COMPLETED,
                from_status=JobStatus.PROCESSING,
                output_files=output_metas,
            )
        except AppError as exc:
            self._store.transition(
                job_id,
                JobStatus.FAILED,
                from_status=JobStatus.PROCESSING,
                error_code=exc.code,
                error_message=exc.message,
            )
        except Exception:
            self._store.transition(
                job_id,
                JobStatus.FAILED,
                from_status=JobStatus.PROCESSING,
                error_code="conversion_failed",
                error_message="Conversion failed due to an internal error.",
            )

    def get_job_for_client(self, job_id: str, access_token: str) -> JobRecord:
        record = self._store.get(job_id)
        self._assert_access(record, access_token)
        self._expire_if_needed(record)
        return self._store.get(job_id)

    def _assert_access(self, record: JobRecord, access_token: str | None) -> None:
        from pdf_tools_api.security.auth import verify_access_token

        if not access_token:
            raise AppError("unauthorized", "Job access token is required.", status_code=401)
        if not verify_access_token(access_token, record.access_token_hash):
            raise AppError("unauthorized", "Invalid job access token.", status_code=403)

    def _expire_if_needed(self, record: JobRecord) -> None:
        if record.status == JobStatus.EXPIRED:
            return
        if self._now() >= record.expires_at:
            try:
                self._store.transition(record.job_id, JobStatus.EXPIRED, from_status=record.status)
            finally:
                self._storage.delete_job(record.job_id)

    def resolve_download(self, job_id: str, access_token: str) -> tuple[Path, str]:
        record = self.get_job_for_client(job_id, access_token)
        if record.status == JobStatus.EXPIRED:
            raise AppError("job_expired", "This job has expired.", status_code=410)
        if record.status != JobStatus.COMPLETED:
            raise AppError(
                "job_not_ready",
                "Output is not available until the job completes successfully.",
                status_code=409,
            )
        if not record.output_files:
            raise AppError("no_output", "No output file is available.", status_code=404)
        meta = record.output_files[0]
        path = output_dir(self._storage.root, job_id) / meta.stored_name
        if not path.is_file():
            raise AppError("no_output", "Output file is missing.", status_code=404)
        return path, meta.original_name

    def parse_settings_json(self, raw: str | None) -> dict[str, Any]:
        if not raw:
            return {}
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise AppError(
                "invalid_settings",
                "Settings must be valid JSON.",
                status_code=400,
            ) from exc
        if not isinstance(data, dict):
            raise AppError("invalid_settings", "Settings must be a JSON object.", status_code=400)
        return data

    def _normalize_settings(
        self,
        converter: Any,
        settings: dict[str, Any] | None,
    ) -> dict[str, Any]:
        schema = converter.settings_schema()
        if schema is None or settings is None:
            return settings or {}
        try:
            return schema.model_validate(settings).model_dump()
        except Exception as exc:
            raise AppError(
                "invalid_settings",
                "Conversion settings are invalid.",
                status_code=400,
            ) from exc
