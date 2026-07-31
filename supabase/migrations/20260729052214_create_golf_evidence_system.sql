/*
# ゴルフ証拠画像管理システム - 初期スキーマ作成

## 概要
ゴルフコンペのドラコン賞・ニアピン賞の証拠画像を管理するシステムのデータベーススキーマを作成します。
ログイン機能なし、端末ID（UUID）で個人識別するアーキテクチャです。

## 新規テーブル

### 1. accounts（アカウント）
- `device_id` (uuid, 主キー): 端末固有ID（crypto.randomUUID()で発行）
- `account_name` (text, ユニーク): アカウント名（重複不可）
- `created_at` (timestamptz): 登録日時

### 2. competitions（コンペ）
- `id` (uuid, 主キー): コンペID
- `device_id` (uuid, 外部キー): 開催者の端末ID → accounts.device_id
- `name` (text): コンペ名
- `date` (date): コンペ開催日
- `course_name` (text): コース名
- `status` (text): コンペ状態（active/completed）
- `created_at` (timestamptz): 作成日時

### 3. evidence_images（証拠画像）
- `id` (uuid, 主キー): 証拠画像ID
- `competition_id` (uuid, 外部キー): コンペID → competitions.id
- `device_id` (uuid, 外部キー): 投稿者の端末ID → accounts.device_id
- `award_type` (text): 賞の種類（drancon=ドラコン賞 / nearpin=ニアピン賞）
- `hole_number` (int2): ホール番号
- `distance` (numeric): 飛距離（ドラコン用、ニアピンは残り距離）
- `image_url` (text): Supabase Storageの画像URL
- `memo` (text): メモ
- `created_at` (timestamptz): 投稿日時

## ストレージ
- `evidence-images` バケットを作成（証拠画像保存用、公開読み取り可）

## セキュリティ（RLS）
- 本アプリはログイン機能なし（端末IDで識別）のため、`TO anon, authenticated` でCRUDを許可
- すべてのテーブルでRLSを有効化
- ストレージバケットも公開読み取り・認証済み書き込みに設定

## 重要事項
1. 端末IDはlocalStorageに保存され、APIヘッダー経由で送信される
2. アカウント名は完全ユニーク制約を設定
3. コンペは1端末あたり複数作成可能
4. 証拠画像はコンペごとに投稿可能
*/

-- ============================================
-- 1. accounts テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  device_id uuid PRIMARY KEY,
  account_name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_accounts" ON accounts;
CREATE POLICY "anon_select_accounts" ON accounts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_accounts" ON accounts;
CREATE POLICY "anon_insert_accounts" ON accounts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_accounts" ON accounts;
CREATE POLICY "anon_update_accounts" ON accounts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_accounts" ON accounts;
CREATE POLICY "anon_delete_accounts" ON accounts FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================
-- 2. competitions テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES accounts(device_id) ON DELETE CASCADE,
  name text NOT NULL,
  date date NOT NULL,
  course_name text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitions_device_id ON competitions(device_id);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_competitions" ON competitions;
CREATE POLICY "anon_select_competitions" ON competitions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_competitions" ON competitions;
CREATE POLICY "anon_insert_competitions" ON competitions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_competitions" ON competitions;
CREATE POLICY "anon_update_competitions" ON competitions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_competitions" ON competitions;
CREATE POLICY "anon_delete_competitions" ON competitions FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================
-- 3. evidence_images テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS evidence_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES accounts(device_id) ON DELETE CASCADE,
  award_type text NOT NULL CHECK (award_type IN ('drancon', 'nearpin')),
  hole_number int2,
  distance numeric(10,2),
  image_url text NOT NULL,
  memo text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_competition_id ON evidence_images(competition_id);
CREATE INDEX IF NOT EXISTS idx_evidence_device_id ON evidence_images(device_id);
CREATE INDEX IF NOT EXISTS idx_evidence_award_type ON evidence_images(award_type);

ALTER TABLE evidence_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_evidence" ON evidence_images;
CREATE POLICY "anon_select_evidence" ON evidence_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_evidence" ON evidence_images;
CREATE POLICY "anon_insert_evidence" ON evidence_images FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_evidence" ON evidence_images;
CREATE POLICY "anon_update_evidence" ON evidence_images FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_evidence" ON evidence_images;
CREATE POLICY "anon_delete_evidence" ON evidence_images FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================
-- 4. ストレージバケット
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-images', 'evidence-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_select_storage_evidence" ON storage.objects;
CREATE POLICY "anon_select_storage_evidence" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'evidence-images');

DROP POLICY IF EXISTS "anon_insert_storage_evidence" ON storage.objects;
CREATE POLICY "anon_insert_storage_evidence" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'evidence-images');

DROP POLICY IF EXISTS "anon_update_storage_evidence" ON storage.objects;
CREATE POLICY "anon_update_storage_evidence" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'evidence-images') WITH CHECK (bucket_id = 'evidence-images');

DROP POLICY IF EXISTS "anon_delete_storage_evidence" ON storage.objects;
CREATE POLICY "anon_delete_storage_evidence" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'evidence-images');
