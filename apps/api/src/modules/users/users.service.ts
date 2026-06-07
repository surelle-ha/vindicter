import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { UserRole } from '../roles/entities/user-role.entity'
import { Role } from '../roles/entities/role.entity'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)     private repo:         Repository<User>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(Role)     private roleRepo:     Repository<Role>,
  ) {}

  findAll() {
    return this.repo.find({
      select: ['id', 'email', 'firstName', 'lastName', 'isActive', 'createdAt', 'updatedAt'],
      relations: ['userRoles', 'userRoles.role'],
      order: { createdAt: 'DESC' },
    })
  }

  async updateRole(userId: string, roleName: string) {
    const user = await this.repo.findOneBy({ id: userId })
    if (!user) throw new NotFoundException('User not found')
    const role = await this.roleRepo.findOneBy({ name: roleName })
    if (!role) throw new NotFoundException(`Role '${roleName}' not found`)
    await this.userRoleRepo.delete({ user: { id: userId } })
    await this.userRoleRepo.save(this.userRoleRepo.create({ user, role }))
    return this.findOne(userId)
  }

  async findOne(id: string) {
    const user = await this.repo.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'isActive', 'createdAt', 'updatedAt', 'jobRole', 'experienceLevel', 'onboardingComplete'],
      relations: ['userRoles', 'userRoles.role', 'apiTokens'],
    })
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  async updateActive(id: string, isActive: boolean) {
    await this.repo.update(id, { isActive })
    return this.findOne(id)
  }

  async remove(id: string) {
    const user = await this.repo.findOneBy({ id })
    if (!user) throw new NotFoundException('User not found')
    await this.repo.remove(user)
  }
}
