import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { config } from 'dotenv'

config()

const dbUrl = process.env.DATABASE_URL ?? ''
if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
  console.error('ERROR: DATABASE_URL must be a PostgreSQL connection string (postgres:// or postgresql://)')
  process.exit(1)
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: dbUrl,
  entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
})
