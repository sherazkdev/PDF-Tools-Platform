import io
from pathlib import Path

import img2pdf
from PIL import Image, ImageOps
from pypdf import PdfReader

from pdf_tools_api.converters.base import (
    BaseConverter,
    ConversionContext,
    ConverterDescriptor,
    ConverterImplementationStatus,
)
from pdf_tools_api.converters.jpg_settings import (
    MARGIN_POINTS,
    JpgToPdfSettings,
    PageSizeOption,
    resolve_page_size,
)
from pdf_tools_api.core.config import get_settings
from pdf_tools_api.core.exceptions import AppError
from pdf_tools_api.security.jpeg_validation import validate_jpeg_image

OUTPUT_NAME = "forgepdf-images.pdf"


class JpgToPdfConverter(BaseConverter):
    @property
    def descriptor(self) -> ConverterDescriptor:
        return ConverterDescriptor(
            converter_id="jpg-to-pdf",
            name="JPG to PDF",
            input_formats=("jpg", "jpeg"),
            output_format="pdf",
            implementation_status=ConverterImplementationStatus.AVAILABLE,
            description="Combine JPEG images into a PDF with layout options.",
        )

    def settings_schema(self):
        return JpgToPdfSettings

    def _ordered_paths(self, context: ConversionContext) -> list[Path]:
        settings = JpgToPdfSettings.from_dict(context.settings or {})
        paths = list(context.input_paths)
        if not settings.file_order:
            return paths
        by_name = {p.name: p for p in paths}
        ordered: list[Path] = []
        for name in settings.file_order:
            if name in by_name:
                ordered.append(by_name[name])
        for p in paths:
            if p not in ordered:
                ordered.append(p)
        return ordered

    def validate_inputs(self, paths: list[Path]) -> None:
        if not paths:
            raise AppError("missing_input", "Upload at least one JPEG image.", status_code=400)
        settings = get_settings()
        if len(paths) > settings.jpg_to_pdf_max_files:
            raise AppError(
                "too_many_files",
                f"Maximum {settings.jpg_to_pdf_max_files} images per conversion.",
                status_code=400,
            )
        for path in paths:
            validate_jpeg_image(path)

    def _prepare_image(self, path: Path, work_dir: Path, index: int) -> Path:
        with Image.open(path) as im:
            im = ImageOps.exif_transpose(im)
            if im.mode not in ("RGB", "L"):
                im = im.convert("RGB")
            needs_rewrite = im.info.get("exif") or path.suffix.lower() not in (".jpg", ".jpeg")
            if not needs_rewrite:
                return path
            dest = work_dir / f"_prepared_{index:04d}.jpg"
            im.save(dest, format="JPEG", quality=95, optimize=True)
            return dest

    def convert(self, context: ConversionContext) -> list[Path]:
        settings = JpgToPdfSettings.from_dict(context.settings or {})
        ordered = self._ordered_paths(context)
        prep_dir = context.work_dir / "_prep"
        prep_dir.mkdir(exist_ok=True)

        prepared: list[Path] = []
        dimensions: list[tuple[int, int]] = []
        for idx, path in enumerate(ordered):
            validate_jpeg_image(path)
            prep = self._prepare_image(path, prep_dir, idx)
            prepared.append(prep)
            with Image.open(prep) as im:
                dimensions.append(im.size)

        output_path = context.output_dir / OUTPUT_NAME
        margin_pt = MARGIN_POINTS[settings.margins]
        border = (margin_pt, margin_pt, margin_pt, margin_pt) if margin_pt else None

        if settings.page_size == PageSizeOption.FIT:
            with open(output_path, "wb") as out:
                out.write(img2pdf.convert([str(p) for p in prepared]))
        else:
            first_pagesize = resolve_page_size(
                settings.page_size,
                settings.orientation,
                dimensions[0][0],
                dimensions[0][1],
            )
            assert first_pagesize is not None
            layout = img2pdf.get_layout_fun(
                pagesize=first_pagesize,
                border=border,
                fit=img2pdf.FitMode.into,
            )
            pdf_bytes_list: list[bytes] = []
            for prep, (w, h) in zip(prepared, dimensions, strict=True):
                pagesize = resolve_page_size(settings.page_size, settings.orientation, w, h)
                if pagesize != first_pagesize:
                    layout = img2pdf.get_layout_fun(
                        pagesize=pagesize,
                        border=border,
                        fit=img2pdf.FitMode.into,
                    )
                pdf_bytes_list.append(img2pdf.convert(str(prep), layout_fun=layout))

            if len(pdf_bytes_list) == 1:
                output_path.write_bytes(pdf_bytes_list[0])
            else:
                writer_buffer = io.BytesIO()
                from pypdf import PdfWriter

                writer = PdfWriter()
                for chunk in pdf_bytes_list:
                    reader = PdfReader(io.BytesIO(chunk))
                    for page in reader.pages:
                        writer.add_page(page)
                writer.write(writer_buffer)
                output_path.write_bytes(writer_buffer.getvalue())

        return [output_path]

    def verify_outputs(self, outputs: list[Path]) -> None:
        if len(outputs) != 1:
            raise AppError("invalid_output", "Expected a single PDF output.", status_code=500)
        path = outputs[0]
        if not path.is_file() or path.stat().st_size < 100:
            raise AppError("invalid_output", "PDF output is missing or too small.", status_code=500)
        try:
            with path.open("rb") as fh:
                header = fh.read(5)
            if header != b"%PDF-":
                raise AppError("invalid_output", "Output is not a valid PDF.", status_code=500)
            reader = PdfReader(str(path))
            if len(reader.pages) < 1:
                raise AppError("invalid_output", "PDF has no pages.", status_code=500)
        except AppError:
            raise
        except Exception as exc:
            raise AppError(
                "invalid_output",
                "Generated PDF failed validation.",
                status_code=500,
            ) from exc
