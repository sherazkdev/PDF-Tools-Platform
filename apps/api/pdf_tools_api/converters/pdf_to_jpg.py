import zipfile
from pathlib import Path

from PIL import Image

from pdf_tools_api.converters.base import (
    BaseConverter,
    ConversionContext,
    ConverterDescriptor,
    ConverterImplementationStatus,
)
from pdf_tools_api.converters.page_range import parse_page_selection
from pdf_tools_api.converters.pdf_to_jpg_settings import (
    DPI_VALUES,
    QUALITY_VALUES,
    PageSelectionMode,
    PdfToJpgSettings,
)
from pdf_tools_api.core.config import get_settings
from pdf_tools_api.core.exceptions import AppError
from pdf_tools_api.security.pdf_validation import assert_render_budget, open_pdf_document

OUTPUT_ZIP = "document-pages.zip"
OUTPUT_JPG_PREFIX = "document-page"


class PdfToJpgConverter(BaseConverter):
    @property
    def descriptor(self) -> ConverterDescriptor:
        return ConverterDescriptor(
            converter_id="pdf-to-jpg",
            name="PDF to JPG",
            input_formats=("pdf",),
            output_format="jpg",
            implementation_status=ConverterImplementationStatus.AVAILABLE,
            description="Rasterize PDF pages to JPEG; ZIP for multiple pages.",
        )

    def settings_schema(self):
        return PdfToJpgSettings

    def validate_inputs(self, paths: list[Path]) -> None:
        if len(paths) != 1:
            raise AppError(
                "invalid_input",
                "Upload exactly one PDF file.",
                status_code=400,
            )
        pdf_path = paths[0]
        if pdf_path.suffix.lower() != ".pdf" and not pdf_path.name.lower().endswith(".pdf"):
            pass
        pdf = open_pdf_document(pdf_path)
        pdf.close()

    def convert(self, context: ConversionContext) -> list[Path]:
        settings = PdfToJpgSettings.from_dict(context.settings or {})
        app_settings = get_settings()
        pdf_path = context.input_paths[0]
        pdf = open_pdf_document(pdf_path)
        page_count = len(pdf)
        try:
            if page_count > app_settings.pdf_max_pages:
                raise AppError(
                    "pdf_too_large",
                    f"Maximum supported pages: {app_settings.pdf_max_pages}.",
                    status_code=400,
                )

            if settings.page_mode == PageSelectionMode.ALL:
                indexes = list(range(page_count))
            else:
                indexes = parse_page_selection(
                    settings.page_range,
                    page_count=page_count,
                    max_selected=app_settings.pdf_max_selected_pages,
                )

            dpi = DPI_VALUES[settings.dpi]
            quality = QUALITY_VALUES[settings.jpeg_quality]
            scale = dpi / 72.0
            pad = max(3, len(str(max(indexes) + 1)))

            rendered_paths: list[Path] = []
            for order, page_index in enumerate(indexes):
                page = pdf[page_index]
                try:
                    width, height = page.get_size()
                    assert_render_budget(width, height, dpi)
                    bitmap = page.render(scale=scale)
                    try:
                        image = bitmap.to_pil()
                        if image.mode in ("RGBA", "LA", "P"):
                            background = Image.new("RGB", image.size, (255, 255, 255))
                            if image.mode == "P":
                                image = image.convert("RGBA")
                            background.paste(
                                image,
                                mask=image.split()[-1] if image.mode in ("RGBA", "LA") else None,
                            )
                            image = background
                        elif image.mode != "RGB":
                            image = image.convert("RGB")
                        human_page = page_index + 1
                        name = f"{OUTPUT_JPG_PREFIX}-{human_page:0{pad}d}.jpg"
                        out_path = context.output_dir / name
                        image.save(out_path, format="JPEG", quality=quality, optimize=True)
                        rendered_paths.append(out_path)
                    finally:
                        bitmap.close()
                finally:
                    page.close()

            if not rendered_paths:
                raise AppError("conversion_failed", "No pages were rendered.", status_code=500)

            if len(rendered_paths) == 1:
                return rendered_paths

            zip_path = context.output_dir / OUTPUT_ZIP
            with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
                for jpg in rendered_paths:
                    archive.write(jpg, arcname=jpg.name)

            if not zipfile.is_zipfile(zip_path):
                raise AppError("invalid_output", "ZIP archive validation failed.", status_code=500)

            return [zip_path]
        finally:
            pdf.close()

    def verify_outputs(self, outputs: list[Path]) -> None:
        if len(outputs) != 1:
            raise AppError("invalid_output", "Expected a single output artifact.", status_code=500)
        path = outputs[0]
        if not path.is_file() or path.stat().st_size < 100:
            raise AppError(
                "invalid_output",
                "Output file is missing or too small.",
                status_code=500,
            )
        suffix = path.suffix.lower()
        if suffix == ".zip":
            if not zipfile.is_zipfile(path):
                raise AppError("invalid_output", "Output is not a valid ZIP.", status_code=500)
            with zipfile.ZipFile(path, "r") as archive:
                for name in archive.namelist():
                    if name.startswith("/") or ".." in name:
                        raise AppError("invalid_output", "Unsafe ZIP member path.", status_code=500)
            return
        if suffix in (".jpg", ".jpeg"):
            try:
                with Image.open(path) as im:
                    im.verify()
            except Exception as exc:
                raise AppError(
                    "invalid_output",
                    "Output is not a valid JPEG.",
                    status_code=500,
                ) from exc
            return
        raise AppError("invalid_output", "Unexpected output type.", status_code=500)
