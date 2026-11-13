import os
import shutil
from pathlib import Path

from pdf_tools_api.core.config import Settings
from pdf_tools_api.core.exceptions import AppError
from pdf_tools_api.storage.paths import input_dir, job_root, output_dir


class StorageService:
    def __init__(self, settings: Settings) -> None:
        self._root = Path(settings.storage_root).resolve()
        self._root.mkdir(parents=True, exist_ok=True)
        self._max_total = settings.max_storage_bytes

    @property
    def root(self) -> Path:
        return self._root

    def ensure_job_dirs(self, job_id: str) -> tuple[Path, Path, Path]:
        work = job_root(self._root, job_id)
        inp = input_dir(self._root, job_id)
        out = output_dir(self._root, job_id)
        inp.mkdir(parents=True, exist_ok=True)
        out.mkdir(parents=True, exist_ok=True)
        return work, inp, out

    def total_usage_bytes(self) -> int:
        total = 0
        if not self._root.exists():
            return 0
        for dirpath, _dirnames, filenames in os.walk(self._root):
            for name in filenames:
                try:
                    total += (Path(dirpath) / name).stat().st_size
                except OSError:
                    continue
        return total

    def enforce_storage_budget(self) -> None:
        if self.total_usage_bytes() > self._max_total:
            raise AppError(
                "storage_full",
                "Temporary storage limit reached. Try again later.",
                status_code=503,
            )

    def delete_job(self, job_id: str) -> bool:
        work = job_root(self._root, job_id)
        if not work.exists():
            return False
        shutil.rmtree(work, ignore_errors=True)
        return True
