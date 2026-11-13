from enum import StrEnum

from pdf_tools_api.core.exceptions import AppError


class JobStatus(StrEnum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"


VALID_TRANSITIONS: dict[JobStatus, frozenset[JobStatus]] = {
    JobStatus.QUEUED: frozenset({JobStatus.PROCESSING, JobStatus.FAILED, JobStatus.EXPIRED}),
    JobStatus.PROCESSING: frozenset({JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.EXPIRED}),
    JobStatus.COMPLETED: frozenset({JobStatus.EXPIRED}),
    JobStatus.FAILED: frozenset({JobStatus.EXPIRED}),
    JobStatus.EXPIRED: frozenset(),
}


def assert_transition(current: JobStatus, new: JobStatus) -> None:
    if new not in VALID_TRANSITIONS[current]:
        raise AppError(
            "invalid_job_transition",
            f"Cannot move job from '{current.value}' to '{new.value}'.",
            status_code=409,
        )
