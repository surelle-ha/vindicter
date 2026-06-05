import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropPricing17502000000001 implements MigrationInterface {
  name = 'DropPricing17502000000001'

  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS pricing_plans CASCADE`)
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS pricing_plans (
        id          UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
        name        VARCHAR(100)   NOT NULL UNIQUE,
        description TEXT,
        token_limit INTEGER        NOT NULL DEFAULT 0,
        price_usd   NUMERIC(8,2)   NOT NULL DEFAULT 0,
        is_active   BOOLEAN        NOT NULL DEFAULT true,
        sort_order  INTEGER        NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
      )
    `)
  }
}
