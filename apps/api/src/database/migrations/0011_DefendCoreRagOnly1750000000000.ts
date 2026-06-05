import { MigrationInterface, QueryRunner } from 'typeorm'

export class DefendCoreRagOnly17500000000001 implements MigrationInterface {
  name = 'DefendCoreRagOnly17500000000001'

  async up(qr: QueryRunner): Promise<void> {
    // Drop LLM-related columns — DefendCore is now a pure RAG/KB retrieval engine.
    // The model that calls it lives on the client (desktop or web-dashboard).
    await qr.query(`ALTER TABLE defendcore_config DROP COLUMN IF EXISTS provider`)
    await qr.query(`ALTER TABLE defendcore_config DROP COLUMN IF EXISTS ollama_base_url`)
    await qr.query(`ALTER TABLE defendcore_config DROP COLUMN IF EXISTS ollama_model`)
    await qr.query(`ALTER TABLE defendcore_config DROP COLUMN IF EXISTS ollama_embed_model`)
    await qr.query(`ALTER TABLE defendcore_config DROP COLUMN IF EXISTS openrouter_api_key`)
    await qr.query(`ALTER TABLE defendcore_config DROP COLUMN IF EXISTS openrouter_model`)
    await qr.query(`ALTER TABLE defendcore_config DROP COLUMN IF EXISTS system_prompt`)
    await qr.query(`ALTER TABLE defendcore_config DROP COLUMN IF EXISTS api_call_count`)
    await qr.query(`ALTER TABLE defendcore_config DROP COLUMN IF EXISTS api_last_called_at`)
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE defendcore_config ADD COLUMN IF NOT EXISTS provider VARCHAR NOT NULL DEFAULT 'ollama'`)
    await qr.query(`ALTER TABLE defendcore_config ADD COLUMN IF NOT EXISTS ollama_base_url VARCHAR NOT NULL DEFAULT 'http://localhost:11434'`)
    await qr.query(`ALTER TABLE defendcore_config ADD COLUMN IF NOT EXISTS ollama_model VARCHAR NOT NULL DEFAULT 'llama3.2'`)
    await qr.query(`ALTER TABLE defendcore_config ADD COLUMN IF NOT EXISTS ollama_embed_model VARCHAR NOT NULL DEFAULT 'nomic-embed-text'`)
    await qr.query(`ALTER TABLE defendcore_config ADD COLUMN IF NOT EXISTS openrouter_api_key VARCHAR NOT NULL DEFAULT ''`)
    await qr.query(`ALTER TABLE defendcore_config ADD COLUMN IF NOT EXISTS openrouter_model VARCHAR NOT NULL DEFAULT 'meta-llama/llama-3.2-3b-instruct:free'`)
    await qr.query(`ALTER TABLE defendcore_config ADD COLUMN IF NOT EXISTS system_prompt TEXT`)
    await qr.query(`ALTER TABLE defendcore_config ADD COLUMN IF NOT EXISTS api_call_count INT NOT NULL DEFAULT 0`)
    await qr.query(`ALTER TABLE defendcore_config ADD COLUMN IF NOT EXISTS api_last_called_at TIMESTAMPTZ`)
  }
}
