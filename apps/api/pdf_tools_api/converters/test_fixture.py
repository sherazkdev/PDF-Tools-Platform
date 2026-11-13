import shutil
from pathlib import Path

from pdf_tools_api.converters.base import (
    BaseConverter,
    ConversionContext,
    ConverterDescriptor,
    ConverterImplementationStatus,
)
from pdf_tools_api.core.exceptions import AppError


class TestFixtureConverter(BaseConverter):
    """Infrastructure test converter — copies a validated fixture to output."""

    @property
    def descriptor(self) -> ConverterDescriptor:
        return ConverterDescriptor(
            converter_id="test-fixture",
            name="Test Fixture Converter",
            input_formats=("bin", "txt"),
            output_format="bin",
            implementation_status=ConverterImplementationStatus.AVAILABLE,
            description="Copies input bytes to output for integration tests only.",
        )

    def validate_inputs(self, paths: list[Path]) -> None:
        if not paths:
            raise AppError("missing_input", "At least one input file is required.", status_code=400)
        for path in paths:
            if not path.is_file() or path.stat().st_size == 0:
                raise AppError(
                    "invalid_input",
                    f"Input file is empty or missing: {path.name}",
                    status_code=400,
                )

    def convert(self, context: ConversionContext) -> list[Path]:
        source = context.input_paths[0]
        dest = context.output_dir / f"{source.stem}.converted.bin"
        shutil.copyfile(source, dest)
        return [dest]

    def verify_outputs(self, outputs: list[Path]) -> None:
        if not outputs:
            raise AppError("invalid_output", "Converter produced no output.", status_code=500)
        for path in outputs:
            if not path.is_file() or path.stat().st_size == 0:
                raise AppError("invalid_output", "Output file is empty.", status_code=500)
