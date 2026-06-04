"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Marketing1749200000000 = void 0;
class Marketing1749200000000 {
    constructor() {
        this.name = 'Marketing1749200000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "marketing_segments" (
        "id"         UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
        "name"       VARCHAR(120) NOT NULL,
        "source"     VARCHAR(120) NOT NULL DEFAULT 'Internal list',
        "status"     VARCHAR(20)  NOT NULL DEFAULT 'draft',
        "owner_team" VARCHAR(80)  NOT NULL DEFAULT 'Marketing',
        "created_at" TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "marketing_contacts" (
        "id"              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
        "email"           VARCHAR(255) NOT NULL,
        "name"            VARCHAR(120),
        "company"         VARCHAR(120),
        "status"          VARCHAR(20)  NOT NULL DEFAULT 'subscribed',
        "last_engaged_at" TIMESTAMPTZ,
        "segment_id"      UUID         REFERENCES "marketing_segments"("id") ON DELETE SET NULL,
        "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMPTZ  NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_marketing_contacts_email_segment" ON "marketing_contacts" ("email", "segment_id")`);
        await queryRunner.query(`CREATE INDEX "idx_marketing_contacts_segment_status" ON "marketing_contacts" ("segment_id", "status")`);
        await queryRunner.query(`
      CREATE TABLE "marketing_campaigns" (
        "id"            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
        "title"         VARCHAR(160) NOT NULL,
        "campaign_kind" VARCHAR(40)  NOT NULL DEFAULT 'internal_update',
        "from_name"     VARCHAR(120) NOT NULL,
        "from_email"    VARCHAR(255) NOT NULL,
        "subject"       VARCHAR(180) NOT NULL,
        "preheader"     VARCHAR(220),
        "body"          TEXT         NOT NULL,
        "cta_label"     VARCHAR(80),
        "cta_url"       TEXT,
        "segment_ids"   JSONB        NOT NULL DEFAULT '[]'::jsonb,
        "status"        VARCHAR(20)  NOT NULL DEFAULT 'draft',
        "scheduled_for" TIMESTAMPTZ,
        "sent_at"       TIMESTAMPTZ,
        "last_error"    TEXT,
        "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMPTZ  NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`CREATE INDEX "idx_marketing_campaigns_status_updated" ON "marketing_campaigns" ("status", "updated_at" DESC)`);
        await queryRunner.query(`
      INSERT INTO "api_accesses" ("resource", "action", "description") VALUES
        ('marketing', 'create', 'Create internal marketing records'),
        ('marketing', 'read',   'Read internal marketing records'),
        ('marketing', 'update', 'Update internal marketing records'),
        ('marketing', 'delete', 'Delete internal marketing records'),
        ('marketing', 'send',   'Send internal marketing email')
      ON CONFLICT DO NOTHING
    `);
        await queryRunner.query(`
      INSERT INTO "api_roles_access" ("role_id", "access_id")
      SELECT r.id, a.id
      FROM "api_roles" r
      CROSS JOIN "api_accesses" a
      WHERE r.name = 'admin'
        AND a.resource = 'marketing'
        AND NOT EXISTS (
          SELECT 1 FROM "api_roles_access" ra
          WHERE ra.role_id = r.id AND ra.access_id = a.id
        )
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "marketing_campaigns"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "marketing_contacts"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "marketing_segments"`);
        await queryRunner.query(`DELETE FROM "api_accesses" WHERE "resource" = 'marketing'`);
    }
}
exports.Marketing1749200000000 = Marketing1749200000000;
//# sourceMappingURL=0003_Marketing1749200000000.js.map