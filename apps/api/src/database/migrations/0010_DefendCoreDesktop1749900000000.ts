import { MigrationInterface, QueryRunner } from 'typeorm'

export class DefendCoreDesktop17499000000001 implements MigrationInterface {
  name = 'DefendCoreDesktop17499000000001'

  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE defendcore_config ADD COLUMN IF NOT EXISTS desktop_enabled BOOLEAN NOT NULL DEFAULT FALSE`)
    await qr.query(`ALTER TABLE defendcore_config ADD COLUMN IF NOT EXISTS system_prompt TEXT`)
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE defendcore_config DROP COLUMN IF EXISTS desktop_enabled`)
    await qr.query(`ALTER TABLE defendcore_config DROP COLUMN IF EXISTS system_prompt`)
  }
}
