from functools import lru_cache

from pdf_tools_api.converters.registry import get_converter_registry
from pdf_tools_api.core.config import Settings, get_settings
from pdf_tools_api.jobs.store import get_job_store
from pdf_tools_api.services.job_service import JobService
from pdf_tools_api.storage.cleanup import CleanupService
from pdf_tools_api.storage.service import StorageService


@lru_cache
def get_storage_service() -> StorageService:
    return StorageService(get_settings())


def clear_service_caches() -> None:
    import pdf_tools_api.jobs.store as job_store_module
    from pdf_tools_api.converters.registry import reset_converter_registry
    from pdf_tools_api.core.config import clear_settings_cache

    get_storage_service.cache_clear()
    clear_settings_cache()
    reset_converter_registry()
    job_store_module._store = None


def get_job_service() -> JobService:
    settings = get_settings()
    return JobService(
        settings,
        get_job_store(),
        get_storage_service(),
        get_converter_registry(),
    )


def get_cleanup_service() -> CleanupService:
    return CleanupService(get_job_store(), get_storage_service())


def read_settings() -> Settings:
    return get_settings()
