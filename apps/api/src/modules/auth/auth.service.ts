import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { User } from '../users/entities/user.entity'
import { UserRole } from '../roles/entities/user-role.entity'
import { Role } from '../roles/entities/role.entity'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

const TURNSTILE_DUMMY_PASS_SECRET = '1x0000000000000000000000000000000AA'
const TURNSTILE_DUMMY_PASS_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)     private userRepo:     Repository<User>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(Role)     private roleRepo:     Repository<Role>,
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

    const body = new URLSearchParams({
      secret,
      response: dto.turnstileToken,
    })

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const result = await response.json().catch(() => null) as { success?: boolean; ['error-codes']?: string[] } | null
    if (!response.ok || !result?.success) {
      throw new BadRequestException('Turnstile verification failed.')
    }
  }

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOneBy({ email: dto.email.toLowerCase() })
    if (exists) throw new ConflictException('Email already registered')

    const hash = await bcrypt.hash(dto.password, 12)
    const user = this.userRepo.create({
      email:        dto.email.toLowerCase(),
      displayName:  dto.displayName ?? null,
      passwordHash: hash,
    })
    await this.userRepo.save(user)

    const memberRole = await this.roleRepo.findOneBy({ name: 'member' })
    if (memberRole) {
      await this.userRoleRepo.save(this.userRoleRepo.create({ user, role: memberRole }))
    }

    return { access_token: this.jwt.sign({ sub: user.id, email: user.email }) }
  }

  async me(userId: string) {
    return this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'displayName', 'createdAt'],
    })
  }

  async updateDisplayName(userId: string, displayName: string) {
    await this.userRepo.update(userId, { displayName })
  }
}
