import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class RemoveApiTablePrefixes1749300000000 implements MigrationInterface {
    name: string;
    private readonly tableRenames;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
