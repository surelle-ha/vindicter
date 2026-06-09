import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropApiTokensAndDefendCore1750800000000 implements MigrationInterface {
  name = 'DropApiTokensAndDefendCore1750800000000'

  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS "api_tokens" CASCADE`)
    // DefendCore tables — idempotent, already handled by 0016 but ensures full removal
    await qr.query(`DROP INDEX IF EXISTS "idx_defendcore_embeddings_vec"`)
    await qr.query(`DROP TABLE IF EXISTS "defendcore_embeddings" CASCADE`)
    await qr.query(`DROP TABLE IF EXISTS "defendcore_documents" CASCADE`)
    await qr.query(`DROP TABLE IF EXISTS "defendcore_config" CASCADE`)
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS "api_tokens" (
        "id"           UUID         NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"      UUID         NOT NULL,
        "name"         VARCHAR(100) NOT NULL,
        "token_hash"   VARCHAR(255) NOT NULL,
        "token_prefix" VARCHAR(10)  NOT NULL,
        "expires_at"   TIMESTAMPTZ,
        "last_used_at" TIMESTAMPTZ,
        "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "pk_api_tokens" PRIMARY KEY ("id")
      )
    `)
  }
}
