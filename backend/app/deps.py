"""Shared FastAPI dependencies and helpers."""
import random
import string
from fastapi import Header, HTTPException


def get_device_id(x_device_id: str | None = Header(default=None)) -> str:
    if not x_device_id:
        raise HTTPException(status_code=400, detail="X-Device-Id ヘッダーが必要です")
    return x_device_id.strip()


def generate_name_suggestions(base: str) -> list[str]:
    suggestions: list[str] = []
    for suffix in ("123", "golf", "pro", str(random.randint(10, 99))):
        candidate = f"{base}{suffix}"
        if len(candidate) <= 30:
            suggestions.append(candidate)
    return suggestions[:3]
