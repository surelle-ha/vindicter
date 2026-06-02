import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Role } from './entities/role.entity'
import { Access } from './entities/access.entity'
import { RoleAccess } from './entities/role-access.entity'
import { UserRole } from './entities/user-role.entity'

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)       private roleRepo:       Repository<Role>,
    @InjectRepository(Access)     private accessRepo:     Repository<Access>,
    @InjectRepository(RoleAccess) private roleAccessRepo: Repository<RoleAccess>,
    @InjectRepository(UserRole)   private userRoleRepo:   Repository<UserRole>,
  ) {}

  // ── Roles ──────────────────────────────────────────────────────────────────
  findAllRoles() {
    return this.roleRepo.find({ order: { name: 'ASC' } })
  }

  async findOneRole(id: string) {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['roleAccesses', 'roleAccesses.access'],
    })
    if (!role) throw new NotFoundException('Role not found')
    return role
  }

  async createRole(name: string, description?: string) {
    const exists = await this.roleRepo.findOneBy({ name })
    if (exists) throw new ConflictException('Role name already exists')
    return this.roleRepo.save(this.roleRepo.create({ name, description }))
  }

  async deleteRole(id: string) {
    const role = await this.roleRepo.findOneBy({ id })
    if (!role) throw new NotFoundException('Role not found')
    await this.roleRepo.remove(role)
  }

  // ── Accesses ───────────────────────────────────────────────────────────────
  findAllAccesses() {
    return this.accessRepo.find({ order: { resource: 'ASC', action: 'ASC' } })
  }

  async createAccess(resource: string, action: string, description?: string) {
    const exists = await this.accessRepo.findOneBy({ resource, action })
    if (exists) throw new ConflictException('Access already exists')
    return this.accessRepo.save(this.accessRepo.create({ resource, action, description }))
  }

  async deleteAccess(id: string) {
    const access = await this.accessRepo.findOneBy({ id })
    if (!access) throw new NotFoundException('Access not found')
    await this.accessRepo.remove(access)
  }

  // ── Role ↔ Access ──────────────────────────────────────────────────────────
  async assignAccessToRole(roleId: string, accessId: string) {
    const [role, access] = await Promise.all([
      this.roleRepo.findOneBy({ id: roleId }),
      this.accessRepo.findOneBy({ id: accessId }),
    ])
    if (!role)   throw new NotFoundException('Role not found')
    if (!access) throw new NotFoundException('Access not found')
    const exists = await this.roleAccessRepo.findOne({ where: { role: { id: roleId }, access: { id: accessId } } })
    if (exists) return exists
    return this.roleAccessRepo.save(this.roleAccessRepo.create({ role, access }))
  }

  async removeAccessFromRole(roleId: string, accessId: string) {
    const ra = await this.roleAccessRepo.findOne({ where: { role: { id: roleId }, access: { id: accessId } } })
    if (ra) await this.roleAccessRepo.remove(ra)
  }

  // ── User ↔ Role ────────────────────────────────────────────────────────────
  async assignRoleToUser(userId: string, roleId: string) {
    const role = await this.roleRepo.findOneBy({ id: roleId })
    if (!role) throw new NotFoundException('Role not found')
    const exists = await this.userRoleRepo.findOne({ where: { user: { id: userId }, role: { id: roleId } } })
    if (exists) return exists
    return this.userRoleRepo.save(this.userRoleRepo.create({ user: { id: userId } as any, role }))
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    const ur = await this.userRoleRepo.findOne({ where: { user: { id: userId }, role: { id: roleId } } })
    if (ur) await this.userRoleRepo.remove(ur)
  }

  getUserRoles(userId: string) {
    return this.userRoleRepo.find({
      where: { user: { id: userId } },
      relations: ['role'],
    })
  }
}
