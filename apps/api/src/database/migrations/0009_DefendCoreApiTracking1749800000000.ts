import { MigrationInterface, QueryRunner } from 'typeorm'

export class DefendCoreApiTracking17498000000001 implements MigrationInterface {
  name = 'DefendCoreApiTracking17498000000001'

  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE defendcore_config ADD COLUMN IF NOT EXISTS api_call_count INT NOT NULL DEFAULT 0`)
    await qr.query(`ALTER TABLE defendcore_config ADD COLUMN IF NOT EXISTS api_last_called_at TIMESTAMPTZ`)
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE defendcore_config DROP COLUMN IF EXISTS api_call_count`)
    await qr.query(`ALTER TABLE defendcore_config DROP COLUMN IF EXISTS api_last_called_at`)
  }
}
