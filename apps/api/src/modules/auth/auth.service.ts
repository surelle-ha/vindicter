import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { User } from '../users/entities/user.entity'
import { UserRole } from '../roles/entities/user-role.entity'
import { Role } from '../roles/entities/role.entity'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)     private userRepo:     Repository<User>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(Role)     private roleRepo:     Repository<Role>,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOneBy({ email: dto.email.toLowerCase(), isActive: true })
    if (!user) throw new UnauthorizedException('Invalid credentials')
    const ok = await bcrypt.compare(dto.password, user.passwordHash)
    if (!ok) throw new UnauthorizedException('Invalid credentials')
    return { access_token: this.jwt.sign({ sub: user.id, email: user.email }) }
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
