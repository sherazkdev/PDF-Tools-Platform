import re

from pdf_tools_api.core.exceptions import AppError

_TOKEN = re.compile(r"^\s*(\d+)(?:\s*-\s*(\d+))?\s*$")


def parse_page_selection(
    expression: str,
    *,
    page_count: int,
    max_selected: int,
) -> list[int]:
    """Return zero-based page indexes in document order, unique."""
    if page_count < 1:
        raise AppError("invalid_pdf", "PDF has no pages.", status_code=400)
    if not expression or not expression.strip():
        raise AppError(
            "invalid_page_range",
            "Enter a page range or choose all pages.",
            status_code=400,
        )

    indexes: list[int] = []
    parts = [p.strip() for p in expression.split(",") if p.strip()]
    if not parts:
        raise AppError(
            "invalid_page_range",
            "Enter a page range or choose all pages.",
            status_code=400,
        )

    for part in parts:
        match = _TOKEN.match(part)
        if not match:
            raise AppError(
                "invalid_page_range",
                f"Invalid page syntax: '{part}'. Use formats like 1-3, 5, or 8-10.",
                status_code=400,
            )
        start = int(match.group(1))
        end = int(match.group(2) or start)
        if start < 1 or end < 1:
            raise AppError(
                "invalid_page_range",
                "Page numbers must be 1 or greater.",
                status_code=400,
            )
        if start > end:
            raise AppError(
                "invalid_page_range",
                f"Reversed range '{part}' is not allowed.",
                status_code=400,
            )
        if end > page_count:
            raise AppError(
                "invalid_page_range",
                f"Page {end} is outside the document ({page_count} pages).",
                status_code=400,
            )
        for human in range(start, end + 1):
            idx = human - 1
            if idx not in indexes:
                indexes.append(idx)

    if not indexes:
        raise AppError("invalid_page_range", "No pages selected.", status_code=400)
    if len(indexes) > max_selected:
        raise AppError(
            "too_many_pages",
            f"A maximum of {max_selected} pages may be converted at once.",
            status_code=400,
        )
    return sorted(indexes)
