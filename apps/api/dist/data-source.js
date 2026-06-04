"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const dbUrl = process.env.DATABASE_URL ?? '';
if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
    console.error('ERROR: DATABASE_URL must be a PostgreSQL connection string (postgres:// or postgresql://)');
    process.exit(1);
}
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: dbUrl,
    entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
});
//# sourceMappingURL=data-source.js.map