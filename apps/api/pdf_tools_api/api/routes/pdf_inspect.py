from fastapi import APIRouter, File, UploadFile

from pdf_tools_api.core.exceptions import AppError
from pdf_tools_api.security.filenames import sanitize_original_filename
from pdf_tools_api.security.pdf_validation import inspect_pdf_bytes

router = APIRouter(prefix="/tools/pdf-to-jpg", tags=["tools"])


@router.post("/inspect")
async def inspect_pdf_upload(file: UploadFile = File(...)) -> dict[str, int | bool]:
    name = sanitize_original_filename(file.filename or "document.pdf")
    if not name.lower().endswith(".pdf"):
        raise AppError("unsupported_format", "Upload a PDF file.", status_code=400)

    content = await file.read()
    if not content:
        raise AppError("empty_file", "Empty files are not allowed.", status_code=400)
    if not content.startswith(b"%PDF"):
        raise AppError(
            "signature_mismatch",
            "File content does not match a PDF.",
            status_code=400,
        )
    return inspect_pdf_bytes(content)
