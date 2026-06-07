import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SubscriptionsService } from './subscriptions.service'
import { Subscription } from './entities/subscription.entity'
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity'
import { PricingPlan } from '../pricing/entities/pricing-plan.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, WorkspaceMember, PricingPlan])],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
