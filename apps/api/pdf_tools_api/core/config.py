from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: Literal["development", "staging", "production", "test"] = "development"
    app_name: str = "PDF Tools API"
    api_prefix: str = "/api/v1"

    host: str = "127.0.0.1"
    port: int = 8000

    cors_origins: str = Field(default="http://localhost:3000")

    storage_root: str = "./var/storage"
    job_ttl_seconds: int = 3600
    max_storage_bytes: int = 5_368_709_120
    upload_chunk_bytes: int = 262_144

    max_upload_bytes: int = 52_428_800
    max_files_per_job: int = 20
    worker_timeout_seconds: int = 300

    enable_test_converter: bool = False
    job_access_header: str = "X-Job-Access-Token"
    rate_limit_jobs_per_minute: int = 30
    max_concurrent_jobs: int = 4

    max_image_pixels: int = 50_000_000
    max_image_dimension_px: int = 12_000
    jpg_to_pdf_max_files: int = 50

    @field_validator("storage_root")
    @classmethod
    def normalize_storage_root(cls, value: str) -> str:
        return value.strip().rstrip("/\\") or "./var/storage"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


def clear_settings_cache() -> None:
    get_settings.cache_clear()
