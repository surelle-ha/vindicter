import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import type { StringValue } from 'ms'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../users/entities/user.entity'
import { Role } from '../roles/entities/role.entity'
import { UserRole } from '../roles/entities/user-role.entity'
import { Workspace } from '../workspaces/entities/workspace.entity'
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity'
import { Subscription } from '../subscriptions/entities/subscription.entity'
import { PricingPlan } from '../pricing/entities/pricing-plan.entity'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? 'fallback-secret',
        signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as StringValue },
      }),
    }),
    TypeOrmModule.forFeature([User, Role, UserRole, Workspace, WorkspaceMember, Subscription, PricingPlan]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
