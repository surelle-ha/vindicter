import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { DefendCoreConfig } from './entities/defendcore-config.entity'
import { KnowledgeDocument } from './entities/knowledge-document.entity'

const EMBED_TABLE = 'defendcore_embeddings'

@Injectable()
export class DefendCoreService {
  private readonly logger = new Logger(DefendCoreService.name)

  constructor(
    @InjectRepository(DefendCoreConfig) private configRepo: Repository<DefendCoreConfig>,
    @InjectRepository(KnowledgeDocument) private docRepo:   Repository<KnowledgeDocument>,
    private dataSource: DataSource,
  ) {}

  // ── Config ─────────────────────────────────────────────────────────────────
  async getConfig(): Promise<DefendCoreConfig> {
    let cfg = await this.configRepo.findOneBy({ id: 'default' })
    if (!cfg) {
      cfg = this.configRepo.create({ id: 'default' })
      cfg = await this.configRepo.save(cfg)
    }
    return cfg
  }

  async saveConfig(dto: { desktopEnabled?: boolean }): Promise<DefendCoreConfig> {
    let cfg = await this.configRepo.findOneBy({ id: 'default' })
    if (!cfg) cfg = this.configRepo.create({ id: 'default' })
    if (dto.desktopEnabled !== undefined) cfg.desktopEnabled = Boolean(dto.desktopEnabled)
    return this.configRepo.save(cfg)
  }

  // ── Desktop availability status (public, no auth) ──────────────────────────
  async getStatus(): Promise<{ available: boolean; message: string }> {
    try {
      const cfg = await this.getConfig()
      if (!cfg.desktopEnabled) {
        return { available: false, message: 'DefendCore is being developed and improved. Check back soon.' }
      }
      return { available: true, message: 'DefendCore RAG knowledge base is available.' }
    } catch {
      return { available: false, message: 'DefendCore service is temporarily unavailable.' }
    }
  }

  // ── Vector table bootstrap ─────────────────────────────────────────────────
  private tableReady = false

  async ensureTable() {
    if (this.tableReady) return
    const qr = this.dataSource.createQueryRunner()
    await qr.connect()
    try {
      // Try pgvector; fall back silently if unavailable
      let hasVector = false
      try {
        await qr.query(`CREATE EXTENSION IF NOT EXISTS vector`)
        hasVector = true
      } catch { /* pgvector not available — FTS only */ }

      if (hasVector) {
        await qr.query(`
          CREATE TABLE IF NOT EXISTS ${EMBED_TABLE} (
            id          UUID    NOT NULL DEFAULT gen_random_uuid(),
            document_id UUID    NOT NULL,
            chunk_index INT     NOT NULL,
            content     TEXT    NOT NULL,
            embedding   vector(768),
            CONSTRAINT pk_${EMBED_TABLE} PRIMARY KEY (id)
          )
        `)
      } else {
        await qr.query(`
          CREATE TABLE IF NOT EXISTS ${EMBED_TABLE} (
            id          UUID NOT NULL DEFAULT gen_random_uuid(),
            document_id UUID NOT NULL,
            chunk_index INT  NOT NULL,
            content     TEXT NOT NULL,
            CONSTRAINT pk_${EMBED_TABLE} PRIMARY KEY (id)
          )
        `)
      }

      try {
        await qr.query(`
          CREATE INDEX IF NOT EXISTS ${EMBED_TABLE}_fts
          ON ${EMBED_TABLE} USING gin(to_tsvector('english', content))
        `)
      } catch { /* non-fatal */ }

      this.tableReady = true
    } finally {
      await qr.release()
    }
  }

  // ── Chunking ───────────────────────────────────────────────────────────────
  private chunkText(text: string, chunkSize = 600, overlap = 100): string[] {
    const words = text.split(/\s+/)
    const chunks: string[] = []
    let i = 0
    while (i < words.length) {
      chunks.push(words.slice(i, i + chunkSize).join(' '))
      i += chunkSize - overlap
    }
    return chunks.filter(c => c.trim().length > 0)
  }

  // ── Documents ─────────────────────────────────────────────────────────────
  async listDocuments(): Promise<KnowledgeDocument[]> {
    return this.docRepo.find({ order: { createdAt: 'DESC' } })
  }

  async addDocument(title: string, content: string): Promise<KnowledgeDocument> {
    const chunks = this.chunkText(content)
    await this.ensureTable()

    const doc = await this.docRepo.save(this.docRepo.create({ title, chunkCount: chunks.length }))

    const qr = this.dataSource.createQueryRunner()
    await qr.connect()
    try {
      for (let i = 0; i < chunks.length; i++) {
        await qr.query(
          `INSERT INTO ${EMBED_TABLE} (document_id, chunk_index, content) VALUES ($1, $2, $3)`,
          [doc.id, i, chunks[i]],
        )
      }
    } finally {
      await qr.release()
    }

    return doc
  }

  async removeDocument(id: string): Promise<void> {
    const doc = await this.docRepo.findOneBy({ id })
    if (!doc) throw new NotFoundException('Document not found')
    const qr = this.dataSource.createQueryRunner()
    await qr.connect()
    try {
      await qr.query(`DELETE FROM ${EMBED_TABLE} WHERE document_id = $1`, [id])
    } finally {
      await qr.release()
    }
    await this.docRepo.remove(doc)
  }

  async reindexAll(): Promise<void> {
    this.logger.log('Reindex requested — stored chunks are up to date (no re-upload needed).')
  }

  async getDocumentChunks(id: string): Promise<{ title: string; chunks: string[] }> {
    const doc = await this.docRepo.findOneBy({ id })
    if (!doc) throw new NotFoundException('Document not found')
    const qr = this.dataSource.createQueryRunner()
    await qr.connect()
    try {
      const rows: { content: string }[] = await qr.query(
        `SELECT content FROM ${EMBED_TABLE} WHERE document_id = $1 ORDER BY chunk_index`,
        [id],
      )
      return { title: doc.title, chunks: rows.map(r => r.content) }
    } finally {
      await qr.release()
    }
  }

  // ── Web crawl ─────────────────────────────────────────────────────────────
  async crawlUrl(url: string, title?: string): Promise<KnowledgeDocument> {
    let html: string
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Vindicter-DefendCore/1.0 (+https://vindicter.xyz)' },
        signal: AbortSignal.timeout(20_000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      html = await res.text()
    } catch (e) {
      throw new BadRequestException(`Failed to fetch "${url}": ${(e as Error).message}`)
    }

    // Strip HTML tags and collapse whitespace — good enough for text extraction
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&#\d+;/g, ' ').replace(/&[a-z]+;/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()

    if (!text.length) throw new BadRequestException('No readable text found at the provided URL.')

    const docTitle = title?.trim() || new URL(url).hostname + new URL(url).pathname
    return this.addDocument(docTitle, text)
  }

  // ── File upload (base64, supports PDF + DOCX) ──────────────────────────────
  async indexFileBase64(filename: string, base64: string, contentType: string, title?: string): Promise<KnowledgeDocument> {
    const buf = Buffer.from(base64, 'base64')
    const ext = filename.split('.').pop()?.toLowerCase() ?? ''
    let text = ''

    if (contentType.includes('pdf') || ext === 'pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default as (buf: Buffer) => Promise<{ text: string }>
        const result = await pdfParse(buf)
        text = result.text?.trim() ?? ''
      } catch (e) {
        throw new BadRequestException(`PDF parse failed: ${(e as Error).message}`)
      }
    } else if (
      contentType.includes('wordprocessingml') ||
      contentType.includes('msword') ||
      ext === 'docx' || ext === 'doc'
    ) {
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer: buf })
        text = result.value?.trim() ?? ''
      } catch (e) {
        throw new BadRequestException(`DOCX parse failed: ${(e as Error).message}`)
      }
    } else {
      // TXT / MD / CSV — treat as plain text
      text = buf.toString('utf8').trim()
    }

    if (!text.length) throw new BadRequestException('No readable text found in the uploaded file.')
    const docTitle = title?.trim() || filename.replace(/\.[^.]+$/, '')
    return this.addDocument(docTitle, text)
  }

  // ── RAG Retrieval (used by desktop AI models) ──────────────────────────────
  async retrieveChunks(query: string, limit = 6): Promise<{ chunks: string[]; sources: string[] }> {
    await this.ensureTable()
    const qr = this.dataSource.createQueryRunner()
    await qr.connect()
    let rows: { content: string; document_id: string }[] = []
    try {
      // Full-text search first
      rows = await qr.query(
        `SELECT content, document_id FROM ${EMBED_TABLE}
         WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $1)
         LIMIT $2`,
        [query, limit],
      ) ?? []

      // Fallback: return first N chunks so there's always something useful
      if (!rows.length) {
        rows = await qr.query(
          `SELECT content, document_id FROM ${EMBED_TABLE} LIMIT $1`,
          [limit],
        ) ?? []
      }
    } catch (e) {
      this.logger.warn(`RAG retrieval failed: ${(e as Error).message}`)
    } finally {
      await qr.release()
    }

    const docIds = [...new Set(rows.map(r => r.document_id))]
    const sources: string[] = []
    for (const docId of docIds) {
      const doc = await this.docRepo.findOneBy({ id: docId })
      if (doc) sources.push(doc.title)
    }

    return { chunks: rows.map(r => r.content), sources }
  }
}
