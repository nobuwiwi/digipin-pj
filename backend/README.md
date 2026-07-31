# Golf Evidence API — FastAPI Backend

共通バックエンド（Web版PWA + Expoアプリ両方で利用）

## セットアップ

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# .env に Supabase URL と Service Role Key を記入
```

## 起動

```bash
python run.py
# または
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

APIサーバー: http://localhost:8000

## APIドキュメント

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `SUPABASE_URL` | Supabase プロジェクトURL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key |
| `ALLOWED_ORIGINS` | CORS許可オリジン（カンマ区切り） |

## デプロイ

FastAPIはPythonサーバーのため、bolt.host（静的サイト配信）では動作しません。
以下のサービスでのデプロイを想定しています：

- Render
- Railway
- Fly.io
- その他 Python対応ホスティング
