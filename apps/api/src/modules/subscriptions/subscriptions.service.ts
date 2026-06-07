import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Subscription } from './entities/subscription.entity'
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity'
import { PricingPlan } from '../pricing/entities/pricing-plan.entity'

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)    private subRepo:  Repository<Subscription>,
    @InjectRepository(WorkspaceMember) private memRepo:  Repository<WorkspaceMember>,
    @InjectRepository(PricingPlan)     private planRepo: Repository<PricingPlan>,
  ) {}

  private async assertMember(workspaceId: string, userId: string) {
    const m = await this.memRepo.findOne({ where: { workspace: { id: workspaceId }, user: { id: userId } } })
    if (!m) throw new ForbiddenException('Not a member of this workspace')
    return m
  }

  async get(workspaceId: string, userId: string) {
    await this.assertMember(workspaceId, userId)
    const sub = await this.subRepo.findOne({
      where: { workspace: { id: workspaceId } },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    })
    if (!sub) throw new NotFoundException('No subscription for this workspace')
    return sub
  }

  async changePlan(workspaceId: string, userId: string, planId: string) {
    const member = await this.assertMember(workspaceId, userId)
    if (!['owner', 'admin'].includes(member.memberRole)) {
      throw new ForbiddenException('Only workspace owners and admins can change the plan')
    }
    const plan = await this.planRepo.findOneBy({ id: planId })
    if (!plan) throw new NotFoundException('Plan not found')

    const sub = await this.subRepo.findOne({
      where: { workspace: { id: workspaceId } },
      order: { createdAt: 'DESC' },
    })
    if (!sub) throw new NotFoundException('No subscription found')

    sub.plan = plan
    sub.seatLimit = plan.seatLimit
    sub.projectLimit = plan.projectLimit
    return this.subRepo.save(sub)
  }
}
