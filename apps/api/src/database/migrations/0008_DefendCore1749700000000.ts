import { MigrationInterface, QueryRunner } from 'typeorm'

export class DefendCore17497000000001 implements MigrationInterface {
  name = 'DefendCore17497000000001'

  async up(qr: QueryRunner): Promise<void> {
    // Enable pgvector extension
    await qr.query(`CREATE EXTENSION IF NOT EXISTS vector`)

    // DefendCore config (single-row settings)
    await qr.query(`
      CREATE TABLE IF NOT EXISTS defendcore_config (
        id                 VARCHAR     NOT NULL DEFAULT 'default',
        provider           VARCHAR     NOT NULL DEFAULT 'ollama',
        ollama_base_url    VARCHAR     NOT NULL DEFAULT 'http://localhost:11434',
        ollama_model       VARCHAR     NOT NULL DEFAULT 'llama3.2',
        ollama_embed_model VARCHAR     NOT NULL DEFAULT 'nomic-embed-text',
        openrouter_api_key VARCHAR     NOT NULL DEFAULT '',
        openrouter_model   VARCHAR     NOT NULL DEFAULT 'meta-llama/llama-3.2-3b-instruct:free',
        created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT pk_defendcore_config PRIMARY KEY (id)
      )
    `)

    // Knowledge document registry (metadata only — embeddings stored separately)
    await qr.query(`
      CREATE TABLE IF NOT EXISTS defendcore_documents (
        id          UUID        NOT NULL DEFAULT gen_random_uuid(),
        title       VARCHAR     NOT NULL,
        chunk_count INT         NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT pk_defendcore_documents PRIMARY KEY (id)
      )
    `)

    // Vector embeddings table (requires pgvector)
    await qr.query(`
      CREATE TABLE IF NOT EXISTS defendcore_embeddings (
        id          UUID    NOT NULL DEFAULT gen_random_uuid(),
        document_id UUID    NOT NULL,
        chunk_index INT     NOT NULL,
        content     TEXT    NOT NULL,
        embedding   vector(768),
        CONSTRAINT pk_defendcore_embeddings PRIMARY KEY (id)
      )
    `)

    // IVFFlat index for cosine similarity search
    await qr.query(`
      CREATE INDEX IF NOT EXISTS idx_defendcore_embeddings_vec
      ON defendcore_embeddings USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 50)
    `)
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_defendcore_embeddings_vec`)
    await qr.query(`DROP TABLE IF EXISTS defendcore_embeddings`)
    await qr.query(`DROP TABLE IF EXISTS defendcore_documents`)
    await qr.query(`DROP TABLE IF EXISTS defendcore_config`)
  }
}
