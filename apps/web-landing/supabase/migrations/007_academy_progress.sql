-- Academy progress stored per user in the dashboard
CREATE TABLE IF NOT EXISTS academy_progress (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id       TEXT        NOT NULL,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  quiz_attempts   INTEGER     NOT NULL DEFAULT 0,
  quiz_correct    INTEGER     NOT NULL DEFAULT 0,
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS academy_chat_sessions (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id       TEXT        NOT NULL,
  messages        JSONB       NOT NULL DEFAULT '[]',
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS academy_enrollment (
  user_id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  setup_complete         BOOLEAN NOT NULL DEFAULT false,
  ai_model               TEXT,
  certificate_name       TEXT,
  certificate_issued_at  TIMESTAMPTZ,
  last_visited_lesson_id TEXT,
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE academy_progress       ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_chat_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_enrollment     ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "user_own_academy_progress"
    ON academy_progress FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "user_own_academy_chat"
    ON academy_chat_sessions FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "user_own_academy_enrollment"
    ON academy_enrollment FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
