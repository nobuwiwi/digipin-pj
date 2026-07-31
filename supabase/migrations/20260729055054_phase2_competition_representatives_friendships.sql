/*
# フェーズ2: コンペ代表者・フレンド・ホール賞設定

## 概要
コンペの代表者管理機能、フレンド機能、および18ホール分のドラコン賞/ニアピン賞設定を追加します。

## 新規テーブル

### 1. competition_holes（コンペホール賞設定）
- 各ホール（1〜18）の賞タイプを管理
- `id` (uuid, PK)
- `competition_id` (uuid, FK → competitions.id)
- `hole_number` (int2, 1〜18)
- `award_type` (text, 'none' | 'drancon' | 'nearpin')
- ユニーク制約: (competition_id, hole_number)

### 2. competition_representatives（コンペ代表者）
- コンペの代表者関係を管理
- `id` (uuid, PK)
- `competition_id` (uuid, FK → competitions.id)
- `representative_id` (uuid, FK → accounts.device_id) — 代表者の端末ID
- `status` (text, 'pending' | 'approved' | 'rejected')
- `created_at`, `updated_at`

### 3. friendships（フレンド関係）
- ユーザー間のフレンド関係を管理
- `id` (uuid, PK)
- `account_id` (uuid, FK → accounts.device_id) — フレンド申請元
- `friend_id` (uuid, FK → accounts.device_id) — フレンド相手
- ユニーク制約: (account_id, friend_id)
- `created_at`

## セキュリティ（RLS）
- 本アプリはログイン機能なし（端末IDで識別）のため、`TO anon, authenticated` でCRUDを許可
- すべての新規テーブルでRLSを有効化
*/

-- ============================================
-- 1. competition_holes テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS competition_holes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  hole_number int2 NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
  award_type text NOT NULL DEFAULT 'none' CHECK (award_type IN ('none', 'drancon', 'nearpin')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (competition_id, hole_number)
);

CREATE INDEX IF NOT EXISTS idx_competition_holes_comp_id ON competition_holes(competition_id);

ALTER TABLE competition_holes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_comp_holes" ON competition_holes;
CREATE POLICY "anon_select_comp_holes" ON competition_holes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_comp_holes" ON competition_holes;
CREATE POLICY "anon_insert_comp_holes" ON competition_holes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_comp_holes" ON competition_holes;
CREATE POLICY "anon_update_comp_holes" ON competition_holes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_comp_holes" ON competition_holes;
CREATE POLICY "anon_delete_comp_holes" ON competition_holes FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================
-- 2. competition_representatives テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS competition_representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  representative_id uuid NOT NULL REFERENCES accounts(device_id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comp_reps_comp_id ON competition_representatives(competition_id);
CREATE INDEX IF NOT EXISTS idx_comp_reps_rep_id ON competition_representatives(representative_id);
CREATE INDEX IF NOT EXISTS idx_comp_reps_status ON competition_representatives(status);

ALTER TABLE competition_representatives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_comp_reps" ON competition_representatives;
CREATE POLICY "anon_select_comp_reps" ON competition_representatives FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_comp_reps" ON competition_representatives;
CREATE POLICY "anon_insert_comp_reps" ON competition_representatives FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_comp_reps" ON competition_representatives;
CREATE POLICY "anon_update_comp_reps" ON competition_representatives FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_comp_reps" ON competition_representatives;
CREATE POLICY "anon_delete_comp_reps" ON competition_representatives FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================
-- 3. friendships テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(device_id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES accounts(device_id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (account_id, friend_id),
  CHECK (account_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_account_id ON friendships(account_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_friendships" ON friendships;
CREATE POLICY "anon_select_friendships" ON friendships FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_friendships" ON friendships;
CREATE POLICY "anon_insert_friendships" ON friendships FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_friendships" ON friendships;
CREATE POLICY "anon_delete_friendships" ON friendships FOR DELETE
  TO anon, authenticated USING (true);