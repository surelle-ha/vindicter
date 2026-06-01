-- Newsletter signups from the beta download page.
CREATE TABLE IF NOT EXISTS newsletter_signups (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT newsletter_signups_email_key UNIQUE (email)
);

-- Newsletter updates.
CREATE TABLE IF NOT EXISTS newsletter_updates (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT        NOT NULL,
  summary      TEXT,
  body         TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Special beta / organization applications.
CREATE TABLE IF NOT EXISTS special_beta_applications (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  org_name      TEXT        NOT NULL,
  org_size      TEXT        NOT NULL,
  country       TEXT        NOT NULL,
  contact_name  TEXT        NOT NULL,
  contact_email TEXT        NOT NULL,
  partner_type  TEXT        NOT NULL CHECK (partner_type IN ('partner', 'trusted')),
  referral      TEXT,
  agreed_terms  BOOLEAN     NOT NULL DEFAULT false,
  status        TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Support requests submitted from the landing support page.
CREATE TABLE IF NOT EXISTS support_tickets (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name                  TEXT        NOT NULL,
  email                 TEXT        NOT NULL,
  category              TEXT        NOT NULL CHECK (category IN ('setup', 'scan', 'billing', 'bug', 'other')),
  subject               TEXT        NOT NULL,
  message               TEXT        NOT NULL,
  documentation_checked BOOLEAN     NOT NULL DEFAULT false,
  faq_checked           BOOLEAN     NOT NULL DEFAULT false,
  source_url            TEXT,
  status                TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'closed')),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Vindicta dashboard profiles and RBAC.
CREATE TABLE IF NOT EXISTS user_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role         TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_updates_status_created
  ON newsletter_updates (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_special_beta_applications_status_created
  ON special_beta_applications (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created
  ON support_tickets (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role_created
  ON user_profiles (role, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_newsletter_updates_updated_at ON newsletter_updates;
CREATE TRIGGER set_newsletter_updates_updated_at
  BEFORE UPDATE ON newsletter_updates
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_user_profile_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''), ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.user_profiles.display_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_profile_created();

INSERT INTO public.user_profiles (id, email, display_name, role)
SELECT
  id,
  COALESCE(email, ''),
  NULLIF(COALESCE(raw_user_meta_data ->> 'display_name', ''), ''),
  'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Row-level security.
ALTER TABLE newsletter_signups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_updates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_beta_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles             ENABLE ROW LEVEL SECURITY;

-- Public landing page writes.
DO $$ BEGIN
  CREATE POLICY "anon_insert_newsletter"
    ON newsletter_signups
    FOR INSERT TO anon
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "anon_insert_special_beta"
    ON special_beta_applications
    FOR INSERT TO anon
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "anon_insert_support_ticket"
    ON support_tickets
    FOR INSERT TO anon
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Dashboard profile access. Standard users can read themselves; admins can read all profiles.
DO $$ BEGIN
  CREATE POLICY "authenticated_read_profiles_by_role"
    ON user_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.current_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_insert_own_user_profile"
    ON user_profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id AND role = 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
