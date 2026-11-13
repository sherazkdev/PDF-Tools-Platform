import os
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from pdf_tools_api.api.deps import clear_service_caches
from pdf_tools_api.core.app import create_app


@pytest.fixture()
def temp_storage(tmp_path: Path) -> Path:
    storage = tmp_path / "storage"
    storage.mkdir()
    return storage


@pytest.fixture()
def client(temp_storage: Path) -> Generator[TestClient, None, None]:
    os.environ["APP_ENV"] = "test"
    os.environ["ENABLE_TEST_CONVERTER"] = "true"
    os.environ["STORAGE_ROOT"] = str(temp_storage)
    os.environ["MAX_UPLOAD_BYTES"] = "1048576"
    os.environ["MAX_FILES_PER_JOB"] = "3"
    os.environ["JOB_TTL_SECONDS"] = "3600"
    clear_service_caches()
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
    clear_service_caches()
