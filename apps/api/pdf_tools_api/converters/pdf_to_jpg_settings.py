from enum import StrEnum

from pydantic import BaseModel, model_validator


class PageSelectionMode(StrEnum):
    ALL = "all"
    CUSTOM = "custom"


class DpiPreset(StrEnum):
    STANDARD = "72"
    HIGH = "150"
    VERY_HIGH = "200"
    MAXIMUM = "300"


class JpegQualityPreset(StrEnum):
    STANDARD = "standard"
    HIGH = "high"
    MAXIMUM = "maximum"


DPI_VALUES: dict[DpiPreset, int] = {
    DpiPreset.STANDARD: 72,
    DpiPreset.HIGH: 150,
    DpiPreset.VERY_HIGH: 200,
    DpiPreset.MAXIMUM: 300,
}

QUALITY_VALUES: dict[JpegQualityPreset, int] = {
    JpegQualityPreset.STANDARD: 70,
    JpegQualityPreset.HIGH: 85,
    JpegQualityPreset.MAXIMUM: 95,
}


class PdfToJpgSettings(BaseModel):
    page_mode: PageSelectionMode = PageSelectionMode.ALL
    page_range: str = ""
    dpi: DpiPreset = DpiPreset.STANDARD
    jpeg_quality: JpegQualityPreset = JpegQualityPreset.HIGH

    @model_validator(mode="after")
    def custom_requires_range(self) -> "PdfToJpgSettings":
        if self.page_mode == PageSelectionMode.CUSTOM and not self.page_range.strip():
            raise ValueError("page_range is required when page_mode is custom")
        return self

    @classmethod
    def from_dict(cls, data: dict) -> "PdfToJpgSettings":
        return cls.model_validate({k: v for k, v in data.items() if k in cls.model_fields})
