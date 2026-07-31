"""Supabase client singleton for the FastAPI backend."""
import os
from supabase import create_client, Client

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        url = (os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL") or "").strip()
        key = (
            os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
            or os.environ.get("SUPABASE_SERVICE_KEY")
            or os.environ.get("SUPABASE_KEY")
            or os.environ.get("SUPABASE_ANON_KEY")
            or os.environ.get("VITE_SUPABASE_ANON_KEY")
            or ""
        ).strip()
        if not url or not key:
            missing = []
            if not url:
                missing.append("SUPABASE_URL")
            if not key:
                missing.append("SUPABASE_SERVICE_ROLE_KEY")
            raise RuntimeError(
                f"バックエンドの環境変数が未設定です: {', '.join(missing)}。Railway のバックエンドサービスの Variables タブで設定してください。"
            )
        _client = create_client(url, key)
    return _client
