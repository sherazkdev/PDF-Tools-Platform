from pdf_tools_api.converters.base import (
    BaseConverter,
    ConverterDescriptor,
    ConverterImplementationStatus,
)
from pdf_tools_api.core.exceptions import AppError


def _planned_converter(
    converter_id: str,
    name: str,
    inputs: tuple[str, ...],
    output: str,
) -> ConverterDescriptor:
    return ConverterDescriptor(
        converter_id=converter_id,
        name=name,
        input_formats=inputs,
        output_format=output,
        implementation_status=ConverterImplementationStatus.PLANNED,
    )


PLANNED_CATALOG: list[ConverterDescriptor] = [
    _planned_converter("jpg-to-pdf", "JPG to PDF", ("jpg", "jpeg"), "pdf"),
    _planned_converter("word-to-pdf", "Word to PDF", ("docx", "doc"), "pdf"),
    _planned_converter("powerpoint-to-pdf", "PowerPoint to PDF", ("pptx", "ppt"), "pdf"),
    _planned_converter("excel-to-pdf", "Excel to PDF", ("xlsx", "xls"), "pdf"),
    _planned_converter("html-to-pdf", "HTML to PDF", ("html", "htm"), "pdf"),
    _planned_converter("pdf-to-jpg", "PDF to JPG", ("pdf",), "jpg"),
    _planned_converter("pdf-to-word", "PDF to Word", ("pdf",), "docx"),
    _planned_converter("pdf-to-powerpoint", "PDF to PowerPoint", ("pdf",), "pptx"),
    _planned_converter("pdf-to-excel", "PDF to Excel", ("pdf",), "xlsx"),
    _planned_converter("pdf-to-pdfa", "PDF to PDF/A", ("pdf",), "pdf"),
]


class ConverterRegistry:
    def __init__(self) -> None:
        self._by_id: dict[str, BaseConverter | ConverterDescriptor] = {}
        for item in PLANNED_CATALOG:
            self._by_id[item.converter_id] = item

    def register(self, converter: BaseConverter) -> None:
        self._by_id[converter.converter_id] = converter

    def get_descriptor(self, converter_id: str) -> ConverterDescriptor:
        entry = self._by_id.get(converter_id)
        if entry is None:
            raise AppError(
                "unknown_converter",
                f"Unknown converter '{converter_id}'.",
                status_code=404,
            )
        if isinstance(entry, BaseConverter):
            return entry.descriptor
        return entry

    def get_converter(self, converter_id: str) -> BaseConverter:
        entry = self._by_id.get(converter_id)
        if entry is None:
            raise AppError(
                "unknown_converter",
                f"Unknown converter '{converter_id}'.",
                status_code=404,
            )
        if isinstance(entry, ConverterDescriptor):
            raise AppError(
                "converter_not_implemented",
                f"Converter '{converter_id}' is registered but not yet available for processing.",
                status_code=501,
            )
        if not entry.is_implemented:
            raise AppError(
                "converter_not_implemented",
                f"Converter '{converter_id}' is not available for processing.",
                status_code=501,
            )
        return entry

    def list_descriptors(self) -> list[ConverterDescriptor]:
        result: list[ConverterDescriptor] = []
        for entry in self._by_id.values():
            if isinstance(entry, BaseConverter):
                result.append(entry.descriptor)
            else:
                result.append(entry)
        return sorted(result, key=lambda d: d.converter_id)


_registry: ConverterRegistry | None = None


def get_converter_registry() -> ConverterRegistry:
    global _registry
    if _registry is None:
        _registry = ConverterRegistry()
        from pdf_tools_api.converters.test_fixture import TestFixtureConverter
        from pdf_tools_api.core.config import get_settings

        settings = get_settings()
        if settings.enable_test_converter or settings.app_env == "test":
            _registry.register(TestFixtureConverter())
    return _registry


def reset_converter_registry() -> None:
    global _registry
    _registry = None
