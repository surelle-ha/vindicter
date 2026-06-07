import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { User } from '../users/entities/user.entity'
import { UserRole } from '../roles/entities/user-role.entity'
import { Role } from '../roles/entities/role.entity'
import { Workspace } from '../workspaces/entities/workspace.entity'
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity'
import { Subscription } from '../subscriptions/entities/subscription.entity'
import { PricingPlan } from '../pricing/entities/pricing-plan.entity'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

const TURNSTILE_DUMMY_PASS_SECRET = '1x0000000000000000000000000000000AA'
const TURNSTILE_DUMMY_PASS_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)              private userRepo:      Repository<User>,
    @InjectRepository(UserRole)          private userRoleRepo:  Repository<UserRole>,
    @InjectRepository(Role)              private roleRepo:      Repository<Role>,
    @InjectRepository(Workspace)         private wsRepo:        Repository<Workspace>,
    @InjectRepository(WorkspaceMember)   private memRepo:       Repository<WorkspaceMember>,
    @InjectRepository(Subscription)      private subRepo:       Repository<Subscription>,
    @InjectRepository(PricingPlan)       private planRepo:      Repository<PricingPlan>,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    await this.verifyTurnstile(dto)

    const user = await this.userRepo.findOneBy({ email: dto.email.toLowerCase(), isActive: true })
    if (!user) throw new UnauthorizedException('Invalid credentials')
    const ok = await bcrypt.compare(dto.password, user.passwordHash)
    if (!ok) throw new UnauthorizedException('Invalid credentials')
    return { access_token: this.jwt.sign({ sub: user.id, email: user.email }) }
  }

  private async verifyTurnstile(dto: LoginDto) {
    const secret = process.env.TURNSTILE_SECRET_KEY
    if (!secret) return

    const protectedClients = (process.env.TURNSTILE_PROTECTED_CLIENTS ?? 'web-marketing')
      .split(',')
      .map((client) => client.trim())
      .filter(Boolean)

    const shouldVerify = (
      process.env.TURNSTILE_REQUIRED === 'true' ||
      (dto.clientApp ? protectedClients.includes(dto.clientApp) : false)
    )

    if (!shouldVerify) return
    if (!dto.turnstileToken) {
      throw new BadRequestException('Turnstile verification is required.')
    }

    if (secret === TURNSTILE_DUMMY_PASS_SECRET && dto.turnstileToken === TURNSTILE_DUMMY_PASS_TOKEN) {
      return
    }

    const body = new URLSearchParams({ secret, response: dto.turnstileToken })
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const result = await response.json().catch(() => null) as { success?: boolean } | null
    if (!response.ok || !result?.success) {
      throw new BadRequestException('Turnstile verification failed.')
    }
  }

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOneBy({ email: dto.email.toLowerCase() })
    if (exists) throw new ConflictException('Email already registered')

    const hash = await bcrypt.hash(dto.password, 12)
    const user = this.userRepo.create({
      email:     dto.email.toLowerCase(),
      firstName: dto.firstName ?? null,
      lastName:  dto.lastName  ?? null,
      passwordHash: hash,
    })
    await this.userRepo.save(user)

    const memberRole = await this.roleRepo.findOneBy({ name: 'member' })
    if (memberRole) {
      await this.userRoleRepo.save(this.userRoleRepo.create({ user, role: memberRole }))
    }

    // Auto-create a personal workspace with Free subscription
    const slug = dto.firstName ?? dto.email.split('@')[0]
    const wsName = `${slug}'s Workspace`
    const workspace = await this.wsRepo.save(this.wsRepo.create({ name: wsName, ownerId: user.id }))
    await this.memRepo.save(this.memRepo.create({ workspace, user, memberRole: 'owner' }))
    const freePlan = await this.planRepo.findOneBy({ name: 'Free' }).catch(() => null)
    await this.subRepo.save(this.subRepo.create({
      workspace,
      plan:         freePlan ?? null,
      status:       'active',
      seatLimit:    freePlan?.seatLimit    ?? 1,
      projectLimit: freePlan?.projectLimit ?? 3,
    }))

    return { access_token: this.jwt.sign({ sub: user.id, email: user.email }) }
  }

  async me(userId: string) {
    return this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'firstName', 'lastName', 'jobRole', 'experienceLevel', 'onboardingComplete', 'createdAt'],
    })
  }

  async updateProfile(userId: string, dto: {
    firstName?: string
    lastName?: string
    jobRole?: string
    experienceLevel?: string
    onboardingComplete?: boolean
  }) {
    const patch: Record<string, unknown> = {}
    if (dto.firstName          !== undefined) patch.firstName          = dto.firstName
    if (dto.lastName           !== undefined) patch.lastName           = dto.lastName
    if (dto.jobRole            !== undefined) patch.jobRole            = dto.jobRole
    if (dto.experienceLevel    !== undefined) patch.experienceLevel    = dto.experienceLevel
    if (dto.onboardingComplete !== undefined) patch.onboardingComplete = dto.onboardingComplete
    if (Object.keys(patch).length) await this.userRepo.update(userId, patch as any)
    return this.me(userId)
  }
}
