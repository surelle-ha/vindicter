import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { InjectRepository } from '@nestjs/typeorm'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Repository } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { UserRole } from '../../roles/entities/user-role.entity'

interface JwtPayload { sub: string; email: string }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'fallback-secret',
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepo.findOne({ where: { id: payload.sub, isActive: true } })
    if (!user) throw new UnauthorizedException()

    const userRoles = await this.userRoleRepo.find({
      where: { user: { id: user.id } },
      relations: ['role', 'role.roleAccesses', 'role.roleAccesses.access'],
    })

    const roles: string[] = []
    const accesses: string[] = []
    for (const ur of userRoles) {
      roles.push(ur.role.name)
      for (const ra of ur.role.roleAccesses ?? []) {
        accesses.push(`${ra.access.resource}.${ra.access.action}`)
      }
    }

    return { id: user.id, email: user.email, displayName: user.displayName, roles, accesses }
  }
}
