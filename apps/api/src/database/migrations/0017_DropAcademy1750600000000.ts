import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropAcademy1750600000000 implements MigrationInterface {
  name = 'DropAcademy1750600000000'

  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS "idx_academy_chat_sessions_user"`)
    await qr.query(`DROP INDEX IF EXISTS "idx_academy_progress_user"`)
    await qr.query(`DROP TABLE IF EXISTS "academy_chat_sessions"`)
    await qr.query(`DROP TABLE IF EXISTS "academy_progress"`)
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS "academy_progress" (
        "id"           UUID         NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"      UUID         NOT NULL,
        "lesson_id"    VARCHAR(100) NOT NULL,
        "started_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMPTZ,
        CONSTRAINT "pk_academy_progress" PRIMARY KEY ("id"),
        CONSTRAINT "uq_academy_progress_user_lesson" UNIQUE ("user_id", "lesson_id")
      )
    `)
    await qr.query(`CREATE INDEX "idx_academy_progress_user" ON "academy_progress" ("user_id")`)
    await qr.query(`
      CREATE TABLE IF NOT EXISTS "academy_chat_sessions" (
        "id"         UUID         NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"    UUID         NOT NULL,
        "lesson_id"  VARCHAR(100) NOT NULL,
        "messages"   JSONB        NOT NULL DEFAULT '[]',
        "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_academy_chat_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "uq_academy_chat_sessions_user_lesson" UNIQUE ("user_id", "lesson_id")
      )
    `)
    await qr.query(`CREATE INDEX "idx_academy_chat_sessions_user" ON "academy_chat_sessions" ("user_id")`)
  }
}
