import { MigrationInterface, QueryRunner } from 'typeorm'

export class MarketingTemplatesAndSendEvents1749500000000 implements MigrationInterface {
  name = 'MarketingTemplatesAndSendEvents1749500000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "marketing_templates" (
        "id"            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
        "name"          VARCHAR(140) NOT NULL,
        "campaign_kind" VARCHAR(40)  NOT NULL,
        "subject"       VARCHAR(180) NOT NULL,
        "preheader"     VARCHAR(220),
        "body"          TEXT         NOT NULL,
        "cta_label"     VARCHAR(80),
        "cta_url"       TEXT,
        "variable_map"  JSONB        NOT NULL DEFAULT '{}'::jsonb,
        "status"        VARCHAR(20)  NOT NULL DEFAULT 'active',
        "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMPTZ  NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`CREATE INDEX "idx_marketing_templates_kind_status" ON "marketing_templates" ("campaign_kind", "status")`)

    await queryRunner.query(`
      CREATE TABLE "marketing_send_events" (
        "id"               UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
        "campaign_id"      UUID         REFERENCES "marketing_campaigns"("id") ON DELETE SET NULL,
        "campaign_title"   VARCHAR(160) NOT NULL,
        "campaign_kind"    VARCHAR(40)  NOT NULL,
        "recipients_count" INTEGER      NOT NULL DEFAULT 0,
        "test_only"        BOOLEAN      NOT NULL DEFAULT false,
        "test_email"       VARCHAR(255),
        "message_id"       VARCHAR(255),
        "status"           VARCHAR(20)  NOT NULL,
        "error"            TEXT,
        "sent_at"          TIMESTAMPTZ,
        "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`CREATE INDEX "idx_marketing_send_events_created" ON "marketing_send_events" ("created_at" DESC)`)
    await queryRunner.query(`CREATE INDEX "idx_marketing_send_events_campaign" ON "marketing_send_events" ("campaign_id", "created_at" DESC)`)

    await queryRunner.query(`
      CREATE TRIGGER trg_marketing_templates_updated_at
        BEFORE UPDATE ON "marketing_templates"
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_marketing_templates_updated_at ON "marketing_templates"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "marketing_send_events"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "marketing_templates"`)
  }
}
