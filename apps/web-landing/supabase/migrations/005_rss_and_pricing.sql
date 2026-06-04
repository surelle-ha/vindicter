-- RSS feed sources managed by admins
CREATE TABLE IF NOT EXISTS rss_feeds (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT        NOT NULL,
  url        TEXT        NOT NULL UNIQUE,
  category   TEXT        NOT NULL DEFAULT 'general',
  enabled    BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cached RSS articles fetched from feeds
CREATE TABLE IF NOT EXISTS rss_articles (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_id      UUID        NOT NULL REFERENCES rss_feeds(id) ON DELETE CASCADE,
  feed_name    TEXT        NOT NULL,
  title        TEXT        NOT NULL,
  link         TEXT        NOT NULL UNIQUE,
  summary      TEXT,
  published_at TIMESTAMPTZ,
  fetched_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rss_articles_published ON rss_articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_rss_articles_feed      ON rss_articles (feed_id, published_at DESC);

DROP TRIGGER IF EXISTS set_rss_feeds_updated_at ON rss_feeds;
CREATE TRIGGER set_rss_feeds_updated_at
  BEFORE UPDATE ON rss_feeds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE rss_feeds    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_articles ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read articles and feeds
DO $$ BEGIN
  CREATE POLICY "authenticated_read_rss_feeds"
    ON rss_feeds FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "authenticated_read_rss_articles"
    ON rss_articles FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admins can manage feeds
DO $$ BEGIN
  CREATE POLICY "admin_manage_rss_feeds"
    ON rss_feeds FOR ALL TO authenticated
    USING  (public.current_user_role() = 'admin')
    WITH CHECK (public.current_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin_manage_rss_articles"
    ON rss_articles FOR ALL TO authenticated
    USING  (public.current_user_role() = 'admin')
    WITH CHECK (public.current_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed default security RSS feeds
INSERT INTO rss_feeds (name, url, category) VALUES
  ('CS Hub — Attacks',   'https://www.cshub.com/rss/categories/attacks',  'attacks'),
  ('CS Hub — Articles',  'https://www.cshub.com/rss/articles',             'articles'),
  ('CS Hub — Reports',   'https://www.cshub.com/rss/reports',              'reports')
ON CONFLICT (url) DO NOTHING;

-- Fix user role persistence: admin UPDATE policy for user_profiles
DO $$ BEGIN
  CREATE POLICY "admin_update_user_profiles"
    ON user_profiles FOR UPDATE TO authenticated
    USING  (public.current_user_role() = 'admin')
    WITH CHECK (public.current_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Pricing plans for DefendCore
CREATE TABLE IF NOT EXISTS pricing_plans (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT        NOT NULL UNIQUE,
  description   TEXT,
  token_limit   INTEGER     NOT NULL DEFAULT 0,
  price_usd     NUMERIC(8,2) NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_pricing_plans_updated_at ON pricing_plans;
CREATE TRIGGER set_pricing_plans_updated_at
  BEFORE UPDATE ON pricing_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- Everyone (authenticated) can read active plans
DO $$ BEGIN
  CREATE POLICY "authenticated_read_pricing_plans"
    ON pricing_plans FOR SELECT TO authenticated
    USING (is_active = true OR public.current_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admins can manage pricing
DO $$ BEGIN
  CREATE POLICY "admin_manage_pricing_plans"
    ON pricing_plans FOR ALL TO authenticated
    USING  (public.current_user_role() = 'admin')
    WITH CHECK (public.current_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed default pricing plans
INSERT INTO pricing_plans (name, description, token_limit, price_usd, sort_order) VALUES
  ('Free',       'Basic access for individual users',           50000,    0.00, 1),
  ('Basic',      'For individuals and small teams',            250000,    9.00, 2),
  ('Pro',        'For professional security engineers',       1000000,   29.00, 3),
  ('Enterprise', 'Unlimited usage for large organizations', 10000000,   99.00, 4)
ON CONFLICT (name) DO NOTHING;
