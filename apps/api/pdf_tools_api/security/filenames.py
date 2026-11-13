import re
import secrets
from pathlib import Path

_UNSAFE = re.compile(r"[^\w.\-]+", re.ASCII)
_MAX_ORIGINAL_LEN = 180


def sanitize_original_filename(name: str) -> str:
    base = Path(name).name
    if base in ("", ".", ".."):
        return "upload"
    base = _UNSAFE.sub("_", base.strip())
    return base[:_MAX_ORIGINAL_LEN] or "upload"


def generate_internal_filename(original: str) -> str:
    ext = Path(original).suffix.lower()[:16]
    token = secrets.token_hex(16)
    return f"{token}{ext}"
