import { MigrationInterface, QueryRunner } from 'typeorm'

export class AcademyAndUserProfile1749600000000 implements MigrationInterface {
  name = 'AcademyAndUserProfile1749600000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    // ── Academy progress ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "academy_progress" (
        "id"           UUID         NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"      UUID         NOT NULL,
        "lesson_id"    VARCHAR(100) NOT NULL,
        "started_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMPTZ,
        CONSTRAINT "pk_academy_progress" PRIMARY KEY ("id"),
        CONSTRAINT "uq_academy_progress_user_lesson" UNIQUE ("user_id", "lesson_id")
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_academy_progress_user" ON "academy_progress" ("user_id")`)

    // ── Academy chat sessions ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "academy_chat_sessions" (
        "id"         UUID         NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"    UUID         NOT NULL,
        "lesson_id"  VARCHAR(100) NOT NULL,
        "messages"   JSONB        NOT NULL DEFAULT '[]',
        "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_academy_chat_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "uq_academy_chat_sessions_user_lesson" UNIQUE ("user_id", "lesson_id")
      )
    `)
    await queryRunner.query(`CREATE INDEX "idx_academy_chat_sessions_user" ON "academy_chat_sessions" ("user_id")`)

    // ── User profile fields ───────────────────────────────────────────────────
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "job_role"            VARCHAR(100)`)
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "experience_level"    VARCHAR(100)`)
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_complete" BOOLEAN NOT NULL DEFAULT false`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "onboarding_complete"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "experience_level"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "job_role"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "academy_chat_sessions"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "academy_progress"`)
  }
}
