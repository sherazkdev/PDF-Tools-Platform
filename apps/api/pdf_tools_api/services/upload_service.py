import shutil
from pathlib import Path

from fastapi import UploadFile

from pdf_tools_api.core.config import Settings
from pdf_tools_api.core.exceptions import AppError
from pdf_tools_api.jobs.models import StoredFileMeta
from pdf_tools_api.security.filenames import generate_internal_filename, sanitize_original_filename
from pdf_tools_api.security.signatures import validate_upload_signature


class UploadService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def save_uploads(
        self,
        files: list[UploadFile],
        destination: Path,
    ) -> list[StoredFileMeta]:
        if not files:
            raise AppError("missing_files", "At least one file is required.", status_code=400)
        if len(files) > self._settings.max_files_per_job:
            raise AppError(
                "too_many_files",
                f"A maximum of {self._settings.max_files_per_job} files is allowed.",
                status_code=400,
            )

        destination.mkdir(parents=True, exist_ok=True)
        stored: list[StoredFileMeta] = []
        chunk = self._settings.upload_chunk_bytes

        for upload in files:
            original = sanitize_original_filename(upload.filename or "upload")
            internal = generate_internal_filename(original)
            target = (destination / internal).resolve()
            if not str(target).startswith(str(destination.resolve())):
                raise AppError("invalid_path", "Invalid upload target.", status_code=400)

            written = 0
            try:
                with target.open("wb") as out:
                    while True:
                        data = await upload.read(chunk)
                        if not data:
                            break
                        written += len(data)
                        if written > self._settings.max_upload_bytes:
                            raise AppError(
                                "file_too_large",
                                f"Max file size is {self._settings.max_upload_bytes} bytes.",
                                status_code=413,
                            )
                        out.write(data)
            finally:
                await upload.close()

            if written == 0:
                target.unlink(missing_ok=True)
                raise AppError("empty_file", "Empty files are not allowed.", status_code=400)

            ext = Path(original).suffix
            validate_upload_signature(target, ext, upload.content_type)

            stored.append(
                StoredFileMeta(
                    stored_name=internal,
                    original_name=original,
                    size_bytes=written,
                    content_type=upload.content_type,
                )
            )

        return stored

    def remove_partial(self, destination: Path) -> None:
        if destination.exists():
            shutil.rmtree(destination, ignore_errors=True)
