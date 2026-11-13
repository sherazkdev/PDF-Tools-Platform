from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import StrEnum
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field


class ConverterImplementationStatus(StrEnum):
    PLANNED = "planned"
    AVAILABLE = "available"


@dataclass(frozen=True)
class ConverterDescriptor:
    converter_id: str
    name: str
    input_formats: tuple[str, ...]
    output_format: str
    implementation_status: ConverterImplementationStatus
    description: str = ""


class ConverterSettings(BaseModel):
    """Base settings; converters extend with specific fields."""

    extra_fields: dict[str, Any] = Field(default_factory=dict)


@dataclass
class ConversionContext:
    job_id: str
    work_dir: Path
    input_dir: Path
    output_dir: Path
    input_paths: list[Path]
    settings: dict[str, Any] = field(default_factory=dict)


class BaseConverter(ABC):
    @property
    @abstractmethod
    def descriptor(self) -> ConverterDescriptor:
        raise NotImplementedError

    @property
    def converter_id(self) -> str:
        return self.descriptor.converter_id

    @property
    def is_implemented(self) -> bool:
        return self.descriptor.implementation_status == ConverterImplementationStatus.AVAILABLE

    def settings_schema(self) -> type[BaseModel]:
        return ConverterSettings

    @abstractmethod
    def validate_inputs(self, paths: list[Path]) -> None:
        """Raise AppError on invalid inputs."""

    @abstractmethod
    def convert(self, context: ConversionContext) -> list[Path]:
        """Run conversion; return output file paths relative to work_dir."""

    @abstractmethod
    def verify_outputs(self, outputs: list[Path]) -> None:
        """Raise AppError if outputs are missing or invalid."""
