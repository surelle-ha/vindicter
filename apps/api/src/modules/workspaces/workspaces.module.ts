import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WorkspacesController } from './workspaces.controller'
import { WorkspacesService } from './workspaces.service'
import { Workspace } from './entities/workspace.entity'
import { WorkspaceMember } from './entities/workspace-member.entity'
import { WorkspaceInvitation } from './entities/workspace-invitation.entity'
import { User } from '../users/entities/user.entity'
import { Subscription } from '../subscriptions/entities/subscription.entity'
import { PricingPlan } from '../pricing/entities/pricing-plan.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, WorkspaceMember, WorkspaceInvitation, User, Subscription, PricingPlan])],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
