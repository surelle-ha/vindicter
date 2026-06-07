import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PricingPlan } from './entities/pricing-plan.entity'

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(PricingPlan) private planRepo: Repository<PricingPlan>,
  ) {}

  findAll(adminView = false) {
    const where = adminView ? {} : { isActive: true }
    return this.planRepo.find({ where, order: { sortOrder: 'ASC' } })
  }

  async findOne(id: string) {
    const plan = await this.planRepo.findOneBy({ id })
    if (!plan) throw new NotFoundException('Plan not found')
    return plan
  }

  create(dto: { name: string; description?: string; tokenLimit: number; seatLimit?: number; projectLimit?: number; priceUsd: number; sortOrder?: number }) {
    return this.planRepo.save(this.planRepo.create({
      name: dto.name,
      description: dto.description ?? null,
      tokenLimit: dto.tokenLimit,
      seatLimit: dto.seatLimit ?? 1,
      projectLimit: dto.projectLimit ?? 3,
      priceUsd: dto.priceUsd,
      sortOrder: dto.sortOrder ?? 0,
    }))
  }

  async update(id: string, dto: Partial<{
    name: string; description: string | null; tokenLimit: number
    seatLimit: number; projectLimit: number
    priceUsd: number; isActive: boolean; sortOrder: number
  }>) {
    const plan = await this.findOne(id)
    Object.assign(plan, dto)
    return this.planRepo.save(plan)
  }

  async remove(id: string) {
    const plan = await this.findOne(id)
    await this.planRepo.remove(plan)
  }
}
