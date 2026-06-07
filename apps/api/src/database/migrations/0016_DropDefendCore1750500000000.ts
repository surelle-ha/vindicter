import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropDefendCore17505000000001 implements MigrationInterface {
  name = 'DropDefendCore17505000000001'

  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_defendcore_embeddings_vec`)
    await qr.query(`DROP TABLE IF EXISTS defendcore_embeddings`)
    await qr.query(`DROP TABLE IF EXISTS defendcore_documents`)
    await qr.query(`DROP TABLE IF EXISTS defendcore_config`)
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS defendcore_config (
        id              VARCHAR     NOT NULL DEFAULT 'default',
        desktop_enabled BOOLEAN     NOT NULL DEFAULT FALSE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT pk_defendcore_config PRIMARY KEY (id)
      )
    `)
    await qr.query(`
      CREATE TABLE IF NOT EXISTS defendcore_documents (
        id          UUID        NOT NULL DEFAULT gen_random_uuid(),
        title       VARCHAR     NOT NULL,
        chunk_count INT         NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT pk_defendcore_documents PRIMARY KEY (id)
      )
    `)
    await qr.query(`
      CREATE TABLE IF NOT EXISTS defendcore_embeddings (
        id          UUID NOT NULL DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL,
        chunk_index INT  NOT NULL,
        content     TEXT NOT NULL,
        embedding   vector(768),
        CONSTRAINT pk_defendcore_embeddings PRIMARY KEY (id)
      )
    `)
    await qr.query(`
      CREATE INDEX IF NOT EXISTS idx_defendcore_embeddings_vec
      ON defendcore_embeddings USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 50)
    `)
  }
}
