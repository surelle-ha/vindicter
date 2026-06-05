"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveApiTablePrefixes1749300000000 = void 0;
class RemoveApiTablePrefixes1749300000000 {
    constructor() {
        this.name = 'RemoveApiTablePrefixes1749300000000';
        this.tableRenames = [
            ['api_users', 'users'],
            ['api_roles', 'roles'],
            ['api_accesses', 'accesses'],
            ['api_roles_access', 'roles_access'],
            ['api_user_roles', 'user_roles'],
            ['api_newsletter_signups', 'newsletter_signups'],
            ['api_newsletter_updates', 'newsletter_updates'],
            ['api_special_beta_applications', 'special_beta_applications'],
            ['api_support_tickets', 'support_tickets'],
            ['api_api_tokens', 'api_tokens'],
        ];
    }
    async up(queryRunner) {
        for (const [from, to] of this.tableRenames) {
            await queryRunner.query(`ALTER TABLE IF EXISTS "${from}" RENAME TO "${to}"`);
        }
        await queryRunner.query(`ALTER INDEX IF EXISTS "idx_api_newsletter_signups_token" RENAME TO "idx_newsletter_signups_token"`);
        await queryRunner.query(`ALTER INDEX IF EXISTS "idx_api_newsletter_updates_status" RENAME TO "idx_newsletter_updates_status"`);
        await queryRunner.query(`ALTER TRIGGER "trg_api_users_updated_at" ON "users" RENAME TO "trg_users_updated_at"`);
        await queryRunner.query(`ALTER TRIGGER "trg_api_newsletter_updates_updated_at" ON "newsletter_updates" RENAME TO "trg_newsletter_updates_updated_at"`);
        await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_proc
          WHERE proname = 'set_updated_at'
            AND pronamespace = 'public'::regnamespace
        ) THEN
          DROP FUNCTION IF EXISTS api_set_updated_at() CASCADE;
          CREATE TRIGGER trg_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
          CREATE TRIGGER trg_newsletter_updates_updated_at
            BEFORE UPDATE ON newsletter_updates
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
        ELSE
          ALTER FUNCTION api_set_updated_at() RENAME TO set_updated_at;
        END IF;
      END $$;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER FUNCTION set_updated_at() RENAME TO api_set_updated_at`);
        await queryRunner.query(`ALTER TRIGGER "trg_newsletter_updates_updated_at" ON "newsletter_updates" RENAME TO "trg_api_newsletter_updates_updated_at"`);
        await queryRunner.query(`ALTER TRIGGER "trg_users_updated_at" ON "users" RENAME TO "trg_api_users_updated_at"`);
        await queryRunner.query(`ALTER INDEX IF EXISTS "idx_newsletter_updates_status" RENAME TO "idx_api_newsletter_updates_status"`);
        await queryRunner.query(`ALTER INDEX IF EXISTS "idx_newsletter_signups_token" RENAME TO "idx_api_newsletter_signups_token"`);
        for (const [from, to] of [...this.tableRenames].reverse()) {
            await queryRunner.query(`ALTER TABLE IF EXISTS "${to}" RENAME TO "${from}"`);
        }
    }
}
exports.RemoveApiTablePrefixes1749300000000 = RemoveApiTablePrefixes1749300000000;
//# sourceMappingURL=0004_RemoveApiTablePrefixes1749300000000.js.map