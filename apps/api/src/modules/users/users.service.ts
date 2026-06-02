import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findAll() {
    return this.repo.find({
      select: ['id', 'email', 'displayName', 'isActive', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    })
  }

  async findOne(id: string) {
    const user = await this.repo.findOne({
      where: { id },
      select: ['id', 'email', 'displayName', 'isActive', 'createdAt', 'updatedAt'],
      relations: ['userRoles', 'userRoles.role'],
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
