from pathlib import Path

from PIL import Image


def write_jpeg(path: Path, size: tuple[int, int] = (320, 200), color: str = "blue") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image = Image.new("RGB", size, color)
    image.save(path, format="JPEG", quality=85)
