import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { nanoid } from 'nanoid'
import { NewsletterSignup } from './entities/newsletter-signup.entity'
import { NewsletterUpdate } from './entities/newsletter-update.entity'

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(NewsletterSignup) private signupRepo:  Repository<NewsletterSignup>,
    @InjectRepository(NewsletterUpdate) private updateRepo: Repository<NewsletterUpdate>,
  ) {}

  // ── Signups ────────────────────────────────────────────────────────────────
  async upsertSignup(email: string, accountType = 'individual') {
    const existing = await this.signupRepo.findOneBy({ email: email.toLowerCase() })
    const token = nanoid(32)
    if (existing) {
      existing.downloadToken = token
      await this.signupRepo.save(existing)
      return { email: existing.email, downloadToken: token }
    }
    const signup = this.signupRepo.create({ email: email.toLowerCase(), downloadToken: token, accountType })
    await this.signupRepo.save(signup)
    return { email: signup.email, downloadToken: token }
  }

  async findSignupByToken(token: string) {
    const signup = await this.signupRepo.findOneBy({ downloadToken: token })
    if (!signup) throw new NotFoundException('Token not found')
    return { email: signup.email, downloadToken: signup.downloadToken }
  }

  findAllSignups() {
    return this.signupRepo.find({ order: { createdAt: 'DESC' } })
  }

  // ── Updates ────────────────────────────────────────────────────────────────
  findPublishedUpdates(limit?: number) {
    const query = this.updateRepo
      .createQueryBuilder('u')
      .where('u.status = :status', { status: 'published' })
      .orderBy('u.published_at', 'DESC')
    if (limit) query.take(limit)
    return query.getMany()
  }

  findAllUpdates() {
    return this.updateRepo.find({ order: { createdAt: 'DESC' } })
  }

  async createUpdate(data: Partial<NewsletterUpdate>) {
    const update = this.updateRepo.create(data)
    return this.updateRepo.save(update)
  }

  async updateOne(id: string, data: Partial<NewsletterUpdate>) {
    const update = await this.updateRepo.findOneBy({ id })
    if (!update) throw new NotFoundException('Update not found')
    Object.assign(update, data)
    if (data.status === 'published' && !update.publishedAt) {
      update.publishedAt = new Date()
    }
    return this.updateRepo.save(update)
  }

  async removeUpdate(id: string) {
    const update = await this.updateRepo.findOneBy({ id })
    if (!update) throw new NotFoundException('Update not found')
    await this.updateRepo.remove(update)
  }
}
