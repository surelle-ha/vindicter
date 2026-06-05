import { Controller, Delete, Get, Param, Patch, Body, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { AccessGuard } from '../../common/guards/access.guard'
import { RequireAccess } from '../../common/decorators/require-access.decorator'

@Controller('users')
@UseGuards(JwtAuthGuard, AccessGuard)
export class UsersController {
  constructor(private service: UsersService) {}

  @Get()
  @RequireAccess('users', 'read')
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  @RequireAccess('users', 'read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Patch(':id/active')
  @RequireAccess('users', 'update')
  updateActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.service.updateActive(id, isActive)
  }

  @Patch(':id/role')
  @RequireAccess('users', 'update')
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.service.updateRole(id, role)
  }

  @Delete(':id')
  @RequireAccess('users', 'delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
