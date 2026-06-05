import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AcademyProgress } from './entities/academy-progress.entity'
import { AcademyChatSession } from './entities/academy-chat-session.entity'

@Injectable()
export class AcademyService {
  constructor(
    @InjectRepository(AcademyProgress)    private progressRepo: Repository<AcademyProgress>,
    @InjectRepository(AcademyChatSession) private sessionRepo:  Repository<AcademyChatSession>,
  ) {}

  // ── Progress ────────────────────────────────────────────────────────────────

  getProgress(userId: string) {
    return this.progressRepo.find({ where: { userId } })
  }

  async upsertProgress(userId: string, lessonId: string, completedAt?: Date | null) {
    const existing = await this.progressRepo.findOne({ where: { userId, lessonId } })
    if (existing) {
      if (completedAt !== undefined) existing.completedAt = completedAt ?? null
      return this.progressRepo.save(existing)
    }
    return this.progressRepo.save(
      this.progressRepo.create({ userId, lessonId, completedAt: completedAt ?? null }),
    )
  }

  async deleteProgress(userId: string, lessonId: string) {
    await this.progressRepo.delete({ userId, lessonId })
  }

  // ── Chat sessions ───────────────────────────────────────────────────────────

  getSession(userId: string, lessonId: string) {
    return this.sessionRepo.findOne({ where: { userId, lessonId } })
  }

  async upsertSession(userId: string, lessonId: string, messages: any[]) {
    const existing = await this.sessionRepo.findOne({ where: { userId, lessonId } })
    if (existing) {
      existing.messages  = messages
      existing.updatedAt = new Date()
      return this.sessionRepo.save(existing)
    }
    return this.sessionRepo.save(
      this.sessionRepo.create({ userId, lessonId, messages, updatedAt: new Date() }),
    )
  }

  async deleteSession(userId: string, lessonId: string) {
    await this.sessionRepo.delete({ userId, lessonId })
  }
}
