from pathlib import Path

from pdf_tools_api.core.exceptions import AppError


def _ext_category(ext: str) -> str | None:
    ext = ext.lower().lstrip(".")
    mapping = {
        "jpg": "jpg",
        "jpeg": "jpg",
        "pdf": "pdf",
        "docx": "docx",
        "xlsx": "xlsx",
        "pptx": "pptx",
        "html": "html",
        "htm": "html",
        "txt": "txt",
        "bin": "bin",
    }
    return mapping.get(ext)


def sniff_category(header: bytes, ext: str) -> str | None:
    ext = ext.lower().lstrip(".")
    if header.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if header.startswith(b"%PDF"):
        return "pdf"
    if header.startswith(b"PK\x03\x04"):
        if ext in ("docx", "xlsx", "pptx"):
            return ext
        return None
    stripped = header.lstrip()[:64].lower()
    if stripped.startswith(b"<!doctype html") or stripped.startswith(b"<html"):
        return "html"
    if ext in ("txt", "bin"):
        return ext
    return None


MIME_BY_CATEGORY: dict[str, frozenset[str]] = {
    "jpg": frozenset({"image/jpeg", "image/jpg"}),
    "pdf": frozenset({"application/pdf"}),
    "docx": frozenset({"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}),
    "xlsx": frozenset({"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),
    "pptx": frozenset(
        {"application/vnd.openxmlformats-officedocument.presentationml.presentation"}
    ),
    "html": frozenset({"text/html", "application/xhtml+xml"}),
    "txt": frozenset({"text/plain"}),
    "bin": frozenset({"application/octet-stream"}),
}


def validate_upload_signature(path: Path, declared_ext: str, mime_type: str | None) -> None:
    if path.stat().st_size == 0:
        raise AppError("empty_file", "Empty files are not allowed.", status_code=400)

    category = _ext_category(declared_ext)
    if category is None:
        raise AppError("unsupported_format", "Unsupported file extension.", status_code=400)

    with path.open("rb") as fh:
        header = fh.read(512)

    detected = sniff_category(header, declared_ext)
    if category == "bin":
        if detected not in (None, "bin"):
            raise AppError(
                "signature_mismatch",
                "Binary file content does not look like the declared type.",
                status_code=400,
            )
    elif category == "txt":
        if detected not in (None, "txt", "html"):
            pass
    elif detected != category:
        raise AppError(
            "signature_mismatch",
            "File content does not match the declared extension.",
            status_code=400,
        )

    if mime_type:
        allowed = MIME_BY_CATEGORY.get(category, frozenset())
        if mime_type.lower() not in allowed and mime_type != "application/octet-stream":
            raise AppError(
                "mime_mismatch",
                "Content-Type does not match the uploaded file.",
                status_code=400,
            )
