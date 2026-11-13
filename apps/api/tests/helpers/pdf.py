from pathlib import Path

from pypdf import PdfWriter


def write_multipage_pdf(
    path: Path,
    pages: int = 3,
    width: float = 595,
    height: float = 842,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    writer = PdfWriter()
    for _ in range(pages):
        writer.add_blank_page(width=width, height=height)
    with path.open("wb") as fh:
        writer.write(fh)
