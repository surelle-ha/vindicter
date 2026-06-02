import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SpecialBetaApplication, BetaStatus } from './entities/special-beta-application.entity'

@Injectable()
export class BetaService {
  constructor(@InjectRepository(SpecialBetaApplication) private repo: Repository<SpecialBetaApplication>) {}

  create(data: Omit<SpecialBetaApplication, 'id' | 'createdAt' | 'status'>) {
    return this.repo.save(this.repo.create({ ...data, status: 'pending' }))
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } })
  }

  async updateStatus(id: string, status: BetaStatus) {
    const app = await this.repo.findOneBy({ id })
    if (!app) throw new NotFoundException('Application not found')
    app.status = status
    return this.repo.save(app)
  }

  async remove(id: string) {
    const app = await this.repo.findOneBy({ id })
    if (!app) throw new NotFoundException('Application not found')
    await this.repo.remove(app)
  }
}
