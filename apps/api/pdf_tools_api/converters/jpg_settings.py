from enum import StrEnum

from pydantic import BaseModel, Field, model_validator


class PageSizeOption(StrEnum):
    FIT = "fit"
    A4 = "a4"
    LETTER = "letter"


class OrientationOption(StrEnum):
    AUTO = "auto"
    PORTRAIT = "portrait"
    LANDSCAPE = "landscape"


class MarginOption(StrEnum):
    NONE = "none"
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"


# PDF points (1/72 inch). Same values used by frontend labels.
MARGIN_POINTS: dict[MarginOption, int] = {
    MarginOption.NONE: 0,
    MarginOption.SMALL: 18,
    MarginOption.MEDIUM: 36,
    MarginOption.LARGE: 72,
}

PAGE_A4_PORTRAIT: tuple[float, float] = (595.275591, 841.889764)
PAGE_LETTER_PORTRAIT: tuple[float, float] = (612.0, 792.0)


class JpgToPdfSettings(BaseModel):
    page_size: PageSizeOption = PageSizeOption.FIT
    orientation: OrientationOption = OrientationOption.AUTO
    margins: MarginOption = MarginOption.SMALL
    file_order: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def fit_margin_rules(self) -> "JpgToPdfSettings":
        if self.page_size == PageSizeOption.FIT and self.margins != MarginOption.NONE:
            return self.model_copy(update={"margins": MarginOption.NONE})
        return self

    @classmethod
    def from_dict(cls, data: dict) -> "JpgToPdfSettings":
        return cls.model_validate({k: v for k, v in data.items() if k in cls.model_fields})


def resolve_page_size(
    page_size: PageSizeOption,
    orientation: OrientationOption,
    image_width: int,
    image_height: int,
) -> tuple[float, float] | None:
    if page_size == PageSizeOption.FIT:
        return None

    if page_size == PageSizeOption.A4:
        w, h = PAGE_A4_PORTRAIT
    else:
        w, h = PAGE_LETTER_PORTRAIT

    if orientation == OrientationOption.LANDSCAPE:
        return (h, w)
    if orientation == OrientationOption.PORTRAIT:
        return (w, h)

    if image_width >= image_height:
        return (h, w)
    return (w, h)
