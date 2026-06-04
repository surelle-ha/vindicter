"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenameApiTokensTable1749400000000 = void 0;
class RenameApiTokensTable1749400000000 {
    constructor() {
        this.name = 'RenameApiTokensTable1749400000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE IF EXISTS "api_tokens" RENAME TO "tokens"`);
        await queryRunner.query(`ALTER INDEX IF EXISTS "idx_api_tokens_user_id" RENAME TO "idx_tokens_user_id"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER INDEX IF EXISTS "idx_tokens_user_id" RENAME TO "idx_api_tokens_user_id"`);
        await queryRunner.query(`ALTER TABLE IF EXISTS "tokens" RENAME TO "api_tokens"`);
    }
}
exports.RenameApiTokensTable1749400000000 = RenameApiTokensTable1749400000000;
//# sourceMappingURL=0005_RenameApiTokensTable1749400000000.js.map