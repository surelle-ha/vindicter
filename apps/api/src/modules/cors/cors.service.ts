import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CorsOrigin } from './entities/cors-origin.entity'

// Module-level Set — mutated at runtime so the CORS callback always reflects
// the current DB state without a server restart.
export const allowedOrigins = new Set<string>()

@Injectable()
export class CorsService {
  private readonly logger = new Logger(CorsService.name)

  constructor(
    @InjectRepository(CorsOrigin) private repo: Repository<CorsOrigin>,
  ) {}

  /** Called once at startup to populate the runtime Set from DB. */
  async init(): Promise<void> {
    const rows = await this.repo.find()
    rows.forEach(r => { if (r.enabled) allowedOrigins.add(r.origin) })
    this.logger.log(`CORS: loaded ${rows.filter(r => r.enabled).length} enabled origins from DB`)
  }

  async findAll(): Promise<CorsOrigin[]> {
    return this.repo.find({ order: { createdAt: 'ASC' } })
  }

  async create(origin: string, label = ''): Promise<CorsOrigin> {
    const existing = await this.repo.findOneBy({ origin })
    if (existing) throw new ConflictException(`Origin already exists: ${origin}`)
    const row = await this.repo.save(this.repo.create({ origin: origin.trim(), label: label.trim(), enabled: true }))
    allowedOrigins.add(row.origin)
    return row
  }

  async toggle(id: string, enabled: boolean): Promise<CorsOrigin> {
    const row = await this.repo.findOneBy({ id })
    if (!row) throw new NotFoundException('Origin not found')
    row.enabled = enabled
    const saved = await this.repo.save(row)
    if (enabled) allowedOrigins.add(saved.origin)
    else         allowedOrigins.delete(saved.origin)
    return saved
  }

  async remove(id: string): Promise<void> {
    const row = await this.repo.findOneBy({ id })
    if (!row) throw new NotFoundException('Origin not found')
    allowedOrigins.delete(row.origin)
    await this.repo.remove(row)
  }
}
