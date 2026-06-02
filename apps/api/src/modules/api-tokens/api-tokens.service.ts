import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { nanoid } from 'nanoid'
import { ApiToken } from './entities/api-token.entity'

@Injectable()
export class ApiTokensService {
  constructor(@InjectRepository(ApiToken) private repo: Repository<ApiToken>) {}

  async create(userId: string, name: string, expiresAt?: Date) {
    const rawToken = `vdk_${nanoid(32)}`
    const tokenPrefix = rawToken.slice(0, 12) + '…'
    const token = this.repo.create({
      user: { id: userId } as any,
      name,
      token: rawToken,
      tokenPrefix,
      expiresAt: expiresAt ?? null,
    })
    const saved = await this.repo.save(token)
    return { ...saved, token: rawToken }
  }

  findByUser(userId: string) {
    return this.repo.find({
      where: { user: { id: userId } },
      select: ['id', 'name', 'tokenPrefix', 'expiresAt', 'lastUsedAt', 'createdAt'],
      order: { createdAt: 'DESC' },
    })
  }

  async revoke(userId: string, tokenId: string) {
    const token = await this.repo.findOne({
      where: { id: tokenId, user: { id: userId } },
    })
    if (!token) throw new NotFoundException('Token not found')
    await this.repo.remove(token)
  }
}
