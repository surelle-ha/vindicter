"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Initial1749000000000 = void 0;
class Initial1749000000000 {
    constructor() {
        this.name = 'Initial1749000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "api_users" (
        "id"            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
        "email"         VARCHAR(255)  NOT NULL UNIQUE,
        "display_name"  VARCHAR(100),
        "password_hash" VARCHAR(255)  NOT NULL,
        "is_active"     BOOLEAN       NOT NULL DEFAULT true,
        "created_at"    TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMPTZ   NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "api_roles" (
        "id"          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
        "name"        VARCHAR(50)  NOT NULL UNIQUE,
        "description" VARCHAR(255),
        "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "api_accesses" (
        "id"          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
        "resource"    VARCHAR(100) NOT NULL,
        "action"      VARCHAR(50)  NOT NULL,
        "description" VARCHAR(255),
        "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT uq_access UNIQUE ("resource", "action")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "api_roles_access" (
        "id"         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        "role_id"    UUID        NOT NULL REFERENCES "api_roles"("id") ON DELETE CASCADE,
        "access_id"  UUID        NOT NULL REFERENCES "api_accesses"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_role_access UNIQUE ("role_id", "access_id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "api_user_roles" (
        "id"         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        "user_id"    UUID        NOT NULL REFERENCES "api_users"("id") ON DELETE CASCADE,
        "role_id"    UUID        NOT NULL REFERENCES "api_roles"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_user_role UNIQUE ("user_id", "role_id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "api_newsletter_signups" (
        "id"             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
        "email"          VARCHAR(255) NOT NULL UNIQUE,
        "download_token" VARCHAR(100) UNIQUE,
        "account_type"   VARCHAR(50)  NOT NULL DEFAULT 'individual',
        "created_at"     TIMESTAMPTZ  NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE INDEX idx_api_newsletter_signups_token
        ON api_newsletter_signups (download_token)
        WHERE download_token IS NOT NULL
    `);
        await queryRunner.query(`
      CREATE TABLE "api_newsletter_updates" (
        "id"           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        "title"        VARCHAR(255) NOT NULL,
        "summary"      TEXT,
        "body"         TEXT        NOT NULL,
        "status"       VARCHAR(20)  NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft', 'published', 'archived')),
        "published_at" TIMESTAMPTZ,
        "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE INDEX idx_api_newsletter_updates_status
        ON api_newsletter_updates (status, published_at DESC)
    `);
        await queryRunner.query(`
      CREATE TABLE "api_special_beta_applications" (
        "id"            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        "org_name"      VARCHAR(255) NOT NULL,
        "org_size"      VARCHAR(50)  NOT NULL,
        "country"       VARCHAR(100) NOT NULL,
        "contact_name"  VARCHAR(255) NOT NULL,
        "contact_email" VARCHAR(255) NOT NULL,
        "partner_type"  VARCHAR(50)  NOT NULL DEFAULT 'organization',
        "referral"      TEXT,
        "agreed_terms"  BOOLEAN      NOT NULL DEFAULT false,
        "status"        VARCHAR(20)  NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'approved', 'rejected')),
        "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "api_support_tickets" (
        "id"                     UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        "name"                   VARCHAR(255) NOT NULL,
        "email"                  VARCHAR(255) NOT NULL,
        "category"               VARCHAR(50)  NOT NULL
                                   CHECK (category IN ('setup','scan','billing','bug','other')),
        "subject"                VARCHAR(255) NOT NULL,
        "message"                TEXT         NOT NULL,
        "documentation_checked"  BOOLEAN      NOT NULL DEFAULT false,
        "faq_checked"            BOOLEAN      NOT NULL DEFAULT false,
        "source_url"             VARCHAR(500),
        "status"                 VARCHAR(20)  NOT NULL DEFAULT 'open'
                                   CHECK (status IN ('open','reviewing','closed')),
        "created_at"             TIMESTAMPTZ  NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "api_api_tokens" (
        "id"           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        "user_id"      UUID        NOT NULL REFERENCES "api_users"("id") ON DELETE CASCADE,
        "name"         VARCHAR(100) NOT NULL,
        "token"        VARCHAR(255) NOT NULL UNIQUE,
        "token_prefix" VARCHAR(20)  NOT NULL,
        "expires_at"   TIMESTAMPTZ,
        "last_used_at" TIMESTAMPTZ,
        "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE INDEX idx_api_tokens_user_id
        ON api_api_tokens (user_id, created_at DESC)
    `);
        await queryRunner.query(`
      CREATE OR REPLACE FUNCTION api_set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = now(); RETURN NEW; END;
      $$ LANGUAGE plpgsql
    `);
        for (const table of ['api_users', 'api_newsletter_updates']) {
            await queryRunner.query(`
        CREATE TRIGGER trg_${table}_updated_at
          BEFORE UPDATE ON "${table}"
          FOR EACH ROW EXECUTE FUNCTION api_set_updated_at()
      `);
        }
    }
    async down(queryRunner) {
        for (const table of ['api_users', 'api_newsletter_updates']) {
            await queryRunner.query(`DROP TRIGGER IF EXISTS trg_${table}_updated_at ON "${table}"`);
        }
        await queryRunner.query(`DROP FUNCTION IF EXISTS api_set_updated_at`);
        await queryRunner.query(`DROP TABLE IF EXISTS "api_api_tokens"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "api_support_tickets"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "api_special_beta_applications"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "api_newsletter_updates"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "api_newsletter_signups"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "api_user_roles"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "api_roles_access"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "api_accesses"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "api_roles"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "api_users"`);
    }
}
exports.Initial1749000000000 = Initial1749000000000;
//# sourceMappingURL=0001_Initial1749000000000.js.map