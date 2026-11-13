from datetime import UTC, datetime

from pdf_tools_api.jobs.states import JobStatus
from pdf_tools_api.jobs.store import JobStore
from pdf_tools_api.storage.service import StorageService


class CleanupService:
    def __init__(self, store: JobStore, storage: StorageService) -> None:
        self._store = store
        self._storage = storage

    def expire_due_jobs(self) -> int:
        now = datetime.now(UTC)
        expired_count = 0
        for job_id in self._store.list_expired(now):
            try:
                record = self._store.get(job_id)
                if record.status == JobStatus.EXPIRED:
                    continue
                self._store.transition(job_id, JobStatus.EXPIRED, from_status=record.status)
            except Exception:
                pass
            self._storage.delete_job(job_id)
            expired_count += 1
        return expired_count
