import os

import pytest

from pdf_tools_api.api.deps import clear_service_caches
from pdf_tools_api.converters.registry import get_converter_registry
from pdf_tools_api.core.exceptions import AppError


def test_registry_lists_planned_converters() -> None:
    os.environ["ENABLE_TEST_CONVERTER"] = "true"
    clear_service_caches()
    registry = get_converter_registry()
    descriptors = registry.list_descriptors()
    ids = {d.converter_id for d in descriptors}
    assert "jpg-to-pdf" in ids
    assert "pdf-to-jpg" in ids
    assert "test-fixture" in ids


def test_registry_rejects_unknown() -> None:
    registry = get_converter_registry()
    with pytest.raises(AppError) as exc:
        registry.get_converter("does-not-exist")
    assert exc.value.status_code == 404
