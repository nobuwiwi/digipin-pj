/*
# Device Transfer Codes Table (A案: コード方式)

## Purpose
Enable device-to-device account transfer via a 6-digit code. The old device
generates a code, the new device enters it, and all data ownership
(accounts, competitions, evidence_images, competition_representatives,
friendships) is re-linked from the old device_id to the new device_id.

## New Table: device_transfer_codes
- id (uuid, primary key)
- old_device_id (uuid/text, not null) — the device requesting the transfer
- code (varchar(6), not null) — 6-digit numeric code
- status (text, not null, default 'pending') — 'pending' | 'used' | 'expired'
- new_device_id (text, nullable) — set when the code is consumed
- expires_at (timestamptz, not null) — 10 minutes from creation
- created_at (timestamptz, default now())
- used_at (timestamptz, nullable) — when the transfer completed

## Security
- RLS enabled, anon+authenticated full CRUD (the edge function manages
  authorization logic via device_id headers, and the table is only used
  as a transient transfer handshake — no sensitive user data stored).
*/

CREATE TABLE IF NOT EXISTS device_transfer_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_device_id text NOT NULL,
  code varchar(6) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  new_device_id text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_device_transfer_codes_code ON device_transfer_codes(code);

ALTER TABLE device_transfer_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_transfer_codes" ON device_transfer_codes;
CREATE POLICY "anon_crud_transfer_codes"
  ON device_transfer_codes FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);
