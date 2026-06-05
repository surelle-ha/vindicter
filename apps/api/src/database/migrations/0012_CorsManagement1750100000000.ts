import { MigrationInterface, QueryRunner } from 'typeorm'

const BASE_ORIGINS = [
  { origin: 'http://localhost:3000', label: 'Desktop (Nuxt dev)' },
  { origin: 'http://localhost:3002', label: 'Web Admin (local dev)' },
  { origin: 'http://localhost:3003', label: 'Web Dashboard (local dev)' },
  { origin: 'http://localhost:3004', label: 'Web Landing (local dev)' },
  { origin: 'http://localhost:3005', label: 'Web Marketing (local dev)' },
  { origin: 'tauri://localhost',     label: 'Tauri app (Mac/Linux)' },
  { origin: 'https://tauri.localhost', label: 'Tauri app (Windows)' },
  { origin: 'https://vindicter.xyz',           label: 'Landing page (prod)' },
  { origin: 'https://dashboard.vindicter.xyz', label: 'Dashboard (prod)' },
  { origin: 'https://marketing.vindicta.xyz',  label: 'Marketing (prod)' },
  { origin: 'https://admin.vindicter.xyz',     label: 'Admin (prod)' },
]

export class CorsManagement17501000000001 implements MigrationInterface {
  name = 'CorsManagement17501000000001'

  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE cors_origins (
        id         UUID        NOT NULL DEFAULT gen_random_uuid(),
        origin     VARCHAR     NOT NULL,
        label      VARCHAR     NOT NULL DEFAULT '',
        enabled    BOOLEAN     NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT pk_cors_origins PRIMARY KEY (id),
        CONSTRAINT uq_cors_origins_origin UNIQUE (origin)
      )
    `)

    for (const row of BASE_ORIGINS) {
      await qr.query(
        `INSERT INTO cors_origins (origin, label) VALUES ($1, $2) ON CONFLICT (origin) DO NOTHING`,
        [row.origin, row.label],
      )
    }
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS cors_origins`)
  }
}
