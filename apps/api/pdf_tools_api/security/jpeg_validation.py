from pathlib import Path

from PIL import Image, UnidentifiedImageError

from pdf_tools_api.core.config import get_settings
from pdf_tools_api.core.exceptions import AppError


def validate_jpeg_image(path: Path) -> tuple[int, int]:
    Image.MAX_IMAGE_PIXELS = get_settings().max_image_pixels
    """Verify JPEG via Pillow; return (width, height) after logical orientation."""
    try:
        with Image.open(path) as im:
            im.verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise AppError(
            "invalid_image",
            "The file is not a valid JPEG image.",
            status_code=400,
        ) from exc

    try:
        with Image.open(path) as im:
            if im.format not in ("JPEG", "MPO"):
                raise AppError(
                    "unsupported_format",
                    "Only JPEG images are supported for this converter.",
                    status_code=400,
                )
            width, height = im.size
            if width <= 0 or height <= 0:
                raise AppError("invalid_image", "Image has invalid dimensions.", status_code=400)
            pixels = width * height
            settings = get_settings()
            if pixels > settings.max_image_pixels:
                raise AppError(
                    "image_too_large",
                    "Image resolution exceeds the allowed limit.",
                    status_code=400,
                )
            if max(width, height) > settings.max_image_dimension_px:
                raise AppError(
                    "image_too_large",
                    "Image dimensions exceed the allowed limit.",
                    status_code=400,
                )
            return width, height
    except Image.DecompressionBombError as exc:
        raise AppError(
            "image_too_large",
            "Image exceeds safe decompression limits.",
            status_code=400,
        ) from exc
