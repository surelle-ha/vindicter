import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { InjectRepository } from '@nestjs/typeorm'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Repository } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { UserRole } from '../../roles/entities/user-role.entity'
import { WorkspaceMember } from '../../workspaces/entities/workspace-member.entity'

interface JwtPayload { sub: string; email: string }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(WorkspaceMember) private memberRepo: Repository<WorkspaceMember>,
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

    let workspaces: { id: string; name: string; memberRole: string }[] = []
    try {
      const memberships = await this.memberRepo.find({
        where: { user: { id: user.id } },
        relations: ['workspace'],
      })
      workspaces = memberships.map(m => ({
        id: m.workspace.id,
        name: m.workspace.name,
        memberRole: m.memberRole,
      }))
    } catch {
      // workspace_members table may not exist yet — migration pending
    }

    return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, roles, accesses, workspaces }
  }
}
