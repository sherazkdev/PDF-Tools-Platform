from pathlib import Path

import pypdfium2 as pdfium
from pypdf import PdfReader

from pdf_tools_api.core.config import get_settings
from pdf_tools_api.core.exceptions import AppError


def pdf_is_encrypted(path: Path) -> bool:
    try:
        reader = PdfReader(str(path))
    except Exception as exc:
        raise AppError(
            "invalid_pdf",
            "The file is not a readable PDF document.",
            status_code=400,
        ) from exc
    return bool(reader.is_encrypted)


def pdf_is_encrypted_bytes(data: bytes) -> bool:
    import io

    try:
        reader = PdfReader(io.BytesIO(data))
    except Exception as exc:
        raise AppError(
            "invalid_pdf",
            "The file is not a readable PDF document.",
            status_code=400,
        ) from exc
    return bool(reader.is_encrypted)


def open_pdf_document(path: Path) -> pdfium.PdfDocument:
    if pdf_is_encrypted(path):
        raise AppError(
            "encrypted_pdf",
            "Password-protected PDFs are not supported yet.",
            status_code=400,
        )
    try:
        pdf = pdfium.PdfDocument(str(path))
    except pdfium.PdfiumError as exc:
        raise AppError(
            "invalid_pdf",
            "The file is not a readable PDF document.",
            status_code=400,
        ) from exc
    return pdf


def inspect_pdf_bytes(data: bytes) -> dict[str, int | bool]:
    if pdf_is_encrypted_bytes(data):
        return {"page_count": 0, "encrypted": True}
    try:
        pdf = pdfium.PdfDocument(data)
    except pdfium.PdfiumError as exc:
        raise AppError(
            "invalid_pdf",
            "The file is not a readable PDF document.",
            status_code=400,
        ) from exc
    try:
        count = len(pdf)
        if count < 1:
            raise AppError("invalid_pdf", "PDF has no pages.", status_code=400)
        settings = get_settings()
        if count > settings.pdf_max_pages:
            raise AppError(
                "pdf_too_large",
                f"This PDF has too many pages (max {settings.pdf_max_pages}).",
                status_code=400,
            )
        return {"page_count": count, "encrypted": False}
    finally:
        pdf.close()


def inspect_pdf(path: Path) -> tuple[int, bool]:
    data = path.read_bytes()
    result = inspect_pdf_bytes(data)
    if result["encrypted"]:
        return 0, True
    return int(result["page_count"]), False


def estimate_render_pixels(width_pt: float, height_pt: float, dpi: int) -> int:
    scale = dpi / 72.0
    w_px = max(1, int(width_pt * scale))
    h_px = max(1, int(height_pt * scale))
    return w_px * h_px


def assert_render_budget(width_pt: float, height_pt: float, dpi: int) -> None:
    pixels = estimate_render_pixels(width_pt, height_pt, dpi)
    settings = get_settings()
    if pixels > settings.pdf_max_render_pixels:
        raise AppError(
            "render_too_large",
            "The requested resolution would produce an image that exceeds safe limits.",
            status_code=400,
        )
