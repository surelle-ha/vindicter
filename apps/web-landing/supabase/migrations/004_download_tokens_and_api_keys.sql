-- Add download token + account type tracking to newsletter signups
ALTER TABLE newsletter_signups
  ADD COLUMN IF NOT EXISTS download_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS account_type   TEXT NOT NULL DEFAULT 'individual';

CREATE INDEX IF NOT EXISTS idx_newsletter_signups_download_token
  ON newsletter_signups (download_token)
  WHERE download_token IS NOT NULL;

-- Allow anon to SELECT rows when looking up a download token
DO $$ BEGIN
  CREATE POLICY "anon_select_newsletter_by_token"
    ON newsletter_signups
    FOR SELECT TO anon
    USING (download_token IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow upsert (ON CONFLICT) for returning users
DO $$ BEGIN
  CREATE POLICY "anon_update_newsletter"
    ON newsletter_signups
    FOR UPDATE TO anon
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Widen the partner_type constraint to also accept 'organization'
ALTER TABLE special_beta_applications
  DROP CONSTRAINT IF EXISTS special_beta_applications_partner_type_check;

ALTER TABLE special_beta_applications
  ADD CONSTRAINT special_beta_applications_partner_type_check
  CHECK (partner_type IN ('partner', 'trusted', 'organization'));

-- API tokens for the web-dashboard (DefendCore API access)
CREATE TABLE IF NOT EXISTS api_tokens (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  token        TEXT        NOT NULL UNIQUE,
  token_prefix TEXT        NOT NULL,
  expires_at   TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id
  ON api_tokens (user_id, created_at DESC);

ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "user_manage_own_tokens"
    ON api_tokens
    FOR ALL TO authenticated
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
