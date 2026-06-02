-- Admin read access for dashboard tables
DO $$ BEGIN
  CREATE POLICY "admin_read_newsletter"
    ON newsletter_signups FOR SELECT TO authenticated
    USING (public.current_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin_read_special_beta"
    ON special_beta_applications FOR SELECT TO authenticated
    USING (public.current_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin_update_special_beta"
    ON special_beta_applications FOR UPDATE TO authenticated
    USING (public.current_user_role() = 'admin')
    WITH CHECK (public.current_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin_read_support_tickets"
    ON support_tickets FOR SELECT TO authenticated
    USING (public.current_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin_update_support_tickets"
    ON support_tickets FOR UPDATE TO authenticated
    USING (public.current_user_role() = 'admin')
    WITH CHECK (public.current_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin_read_all_profiles"
    ON user_profiles FOR SELECT TO authenticated
    USING (public.current_user_role() = 'admin' OR auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
