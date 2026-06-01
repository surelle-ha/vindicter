-- Any visitor can read published updates (no auth required)
DO $$ BEGIN
  CREATE POLICY "public_read_published_updates"
    ON newsletter_updates FOR SELECT
    USING (status = 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Authenticated users can read their own profile
DO $$ BEGIN
  CREATE POLICY "self_read_profile"
    ON user_profiles FOR SELECT TO authenticated
    USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
