import { Body, Controller, Delete, Get, Param, Post, ServiceUnavailableException, UseGuards } from '@nestjs/common'
import { DefendCoreService } from './defendcore.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { AccessGuard } from '../../common/guards/access.guard'
import { RequireAccess } from '../../common/decorators/require-access.decorator'
import { SaveConfigDto } from './dto/save-config.dto'

// ── Admin endpoints (JWT auth) ─────────────────────────────────────────────
@Controller('defendcore')
@UseGuards(JwtAuthGuard, AccessGuard)
export class DefendCoreController {
  constructor(private readonly service: DefendCoreService) {}

  @Get('config')
  @RequireAccess('defendcore', 'read')
  getConfig() { return this.service.getConfig() }

  @Post('config')
  @RequireAccess('defendcore', 'update')
  saveConfig(@Body() body: SaveConfigDto) { return this.service.saveConfig(body) }

  @Get('documents')
  @RequireAccess('defendcore', 'read')
  listDocuments() { return this.service.listDocuments() }

  @Post('documents')
  @RequireAccess('defendcore', 'create')
  addDocument(@Body() body: { title: string; content: string }) {
    return this.service.addDocument(body.title, body.content)
  }

  @Get('documents/:id/chunks')
  @RequireAccess('defendcore', 'read')
  getDocumentChunks(@Param('id') id: string) { return this.service.getDocumentChunks(id) }

  @Delete('documents/:id')
  @RequireAccess('defendcore', 'delete')
  removeDocument(@Param('id') id: string) { return this.service.removeDocument(id) }

  @Post('documents/reindex')
  @RequireAccess('defendcore', 'update')
  reindexAll() { return this.service.reindexAll() }

  /** Crawl a URL and index its text content. */
  @Post('documents/crawl')
  @RequireAccess('defendcore', 'create')
  crawlUrl(@Body() body: { url: string; title?: string }) {
    return this.service.crawlUrl(body.url, body.title)
  }

  /** Upload a file as base64 and index it (PDF, DOCX, TXT, MD). */
  @Post('documents/upload')
  @RequireAccess('defendcore', 'create')
  uploadFile(@Body() body: { filename: string; content: string; contentType: string; title?: string }) {
    return this.service.indexFileBase64(body.filename, body.content, body.contentType, body.title)
  }
}

// ── Public endpoints (no JWT) — used by desktop app ───────────────────────
@Controller('defendcore')
export class DefendCorePublicController {
  constructor(private readonly service: DefendCoreService) {}

  /** Availability probe — desktop checks this before showing the RAG toggle. */
  @Get('status')
  getStatus() { return this.service.getStatus() }

  /**
   * RAG chunk retrieval — desktop fetches relevant KB chunks, prepends them
   * to the local model prompt. No LLM is called server-side.
   * Returns 503 when desktopEnabled is false so the desktop can disable the toggle.
   */
  @Post('retrieve')
  async retrieve(@Body() body: { query: string; limit?: number }) {
    const cfg = await this.service.getConfig()
    if (!cfg.desktopEnabled) {
      throw new ServiceUnavailableException(
        'DefendCore RAG is not currently enabled. An administrator must turn on "Ready for Vindicter Desktop" in the admin panel.',
      )
    }
    return this.service.retrieveChunks(body.query, body.limit ?? 6)
  }
}
