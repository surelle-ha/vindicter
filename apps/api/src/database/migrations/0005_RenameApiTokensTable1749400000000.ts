import { MigrationInterface, QueryRunner } from 'typeorm'

export class RenameApiTokensTable1749400000000 implements MigrationInterface {
  name = 'RenameApiTokensTable1749400000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "api_tokens" RENAME TO "tokens"`)
    await queryRunner.query(`ALTER INDEX IF EXISTS "idx_api_tokens_user_id" RENAME TO "idx_tokens_user_id"`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER INDEX IF EXISTS "idx_tokens_user_id" RENAME TO "idx_api_tokens_user_id"`)
    await queryRunner.query(`ALTER TABLE IF EXISTS "tokens" RENAME TO "api_tokens"`)
  }
}
