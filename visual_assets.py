"""Локальные художественные изображения архива, без внешних сетевых запросов."""
from pathlib import Path
from functools import lru_cache
import base64

ROOT = Path(__file__).resolve().parent

@lru_cache(maxsize=16)
def data_uri(relative_path):
    """Возвращает безопасный data URI для локального JPEG-файла."""
    path = (ROOT / relative_path).resolve()
    assets = (ROOT / "assets").resolve()
    if assets not in path.parents or path.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp") or not path.is_file():
        return ""
    mime = {".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".png":"image/png", ".webp":"image/webp"}[path.suffix.lower()]
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode('ascii')}"
