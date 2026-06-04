import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class RenameApiTokensTable1749400000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
