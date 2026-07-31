# Railway デプロイガイド

このプロジェクトは **フロントエンド（Web/PWA）** と **バックエンド（FastAPI）** の2つのサービスとして Railway にデプロイします。

## 前提条件

- [Railway](https://railway.app) アカウント
- GitHub にこのリポジトリをプッシュ済み

---

## 1. バックエンド（FastAPI）をデプロイ

### 手順

1. Railway ダッシュボードで **New Project → Deploy from GitHub repo** を選択
2. リポジトリを選択
3. **Settings → Root Directory** を `backend` に設定
4. Railway が `requirements.txt` を検出して Python サービスとして構成します
5. **Variables** タブで以下の環境変数を設定:

   | 変数名 | 値 |
   |--------|-----|
   | `SUPABASE_URL` | Supabase プロジェクトURL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key |
   | `ALLOWED_ORIGINS` | （後でフロントのURLに更新） |

6. デプロイ完了後、**Settings → Networking → Generate Domain** で公開URLを発行
   - 例: `https://golf-api-production.up.railway.app`
   - このURLをメモしておく

### 起動コマンド（`railway.json` に設定済み）

```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## 2. フロントエンド（Web/PWA）をデプロイ

### 手順

1. 同じ Railway プロジェクト内で **New Service → GitHub Repo** を選択
2. 同じリポジトリを選択
3. **Settings → Root Directory** をプロジェクトルート（空欄または `.`）に設定
4. **Variables** タブで以下の環境変数を設定:

   | 変数名 | 値 |
   |--------|-----|
   | `API_BASE_URL` | バックエンドのURL（例: `https://golf-api-production.up.railway.app`） |
   | `VITE_SUPABASE_URL` | Supabase プロジェクトURL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key |

   ※ `API_BASE_URL` は **ランタイム変数** です。コンテナ起動時に `dist/config.js` が自動生成され、ビルドのし直しは不要です。

5. デプロイ完了後、**Settings → Networking → Generate Domain** で公開URLを発行
   - 例: `https://golf-web-production.up.railway.app`

### ビルド・起動コマンド（`railway.json` に設定済み）

```
ビルド: npm install && npm run build
起動:   config.js 生成 → npx serve dist -l $PORT --single
```

---

## 3. CORS 設定の更新

フロントエンドのデプロイが完了したら、バックエンドの環境変数を更新します:

1. バックエンドサービスの **Variables** タブに移動
2. `ALLOWED_ORIGINS` をフロントエンドのURLに設定:
   ```
   https://golf-web-production.up.railway.app
   ```
3. バックエンドを再デプロイ

---

## 4. PWA 機能について

このアプリは以下のPWA機能を含んでいます:

- `public/manifest.json` — インストール可能なアプリとしての設定
- `public/sw.js` — Service Worker（オフラインキャッシュ）
- `public/icon-192.png` / `public/icon-512.png` — アプリアイコン

スマートフォンのブラウザから「ホーム画面に追加」でアプリとしてインストールできます。

---

## トラブルシューティング

### `Unexpected token '<'` / JSONパースエラーが出る場合
これはAPIリクエストがHTML（`index.html`）で返っている状態です。以下を確認してください:

1. フロントエンドの環境変数 `API_BASE_URL` がバックエンドのURLに設定されているか
   - 例: `https://golf-api-production.up.railway.app`（末尾のスラッシュなし）
2. `API_BASE_URL` を変更した後、フロントエンドが再デプロイされているか
   - Railway は Variables の変更で自動的に再デプロイします
3. ブラウザの開発者ツール → Network タブで、APIリクエストのURLを確認
   - リクエストURLがフロントのドメインになっている場合、`API_BASE_URL` が反映されていません
4. ブラウザで `https://<フロントURL>/config.js` を開き、内容を確認
   - `window.__APP_CONFIG__ = { API_BASE_URL: "https://..." };` になっていれば正常

### APIに接続できない場合
- `API_BASE_URL` が正しいか確認（末尾のスラッシュなし）
- バックエンドの `ALLOWED_ORIGINS` にフロントのURLが含まれているか確認
- バックエンドのデプロイログで起動エラーがないか確認

### 画像アップロードが失敗する場合
- Supabase Storage の `evidence-images` バケットが存在するか確認
- Service Role Key が正しく設定されているか確認

### ビルドが失敗する場合
- Node.js 18以上が使用されているか確認（Railway は自動選択）
- `npm install` が完了しているかビルドログで確認
