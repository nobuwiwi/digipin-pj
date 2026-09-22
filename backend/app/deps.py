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


def get_supabase_user_email(authorization: str | None = Header(default=None)) -> str:
    from .db import get_supabase
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="有効な認証トークンが提供されていません")
    
    token = authorization.split(" ")[1]
    sb = get_supabase()
    
    try:
        user_response = sb.auth.get_user(token)
        if not user_response.user or not user_response.user.email:
            raise HTTPException(status_code=401, detail="メールアドレスの取得に失敗しました")
        return user_response.user.email
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"トークンの検証に失敗しました: {str(e)}")
