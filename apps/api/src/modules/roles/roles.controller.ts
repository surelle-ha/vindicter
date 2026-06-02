import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { RolesService } from './roles.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { AccessGuard } from '../../common/guards/access.guard'
import { RequireAccess } from '../../common/decorators/require-access.decorator'

@Controller()
@UseGuards(JwtAuthGuard, AccessGuard)
export class RolesController {
  constructor(private service: RolesService) {}

  // ── Roles ──────────────────────────────────────────────────────────────────
  @Get('roles')
  @RequireAccess('roles', 'read')
  findAllRoles() { return this.service.findAllRoles() }

  @Get('roles/:id')
  @RequireAccess('roles', 'read')
  findOneRole(@Param('id') id: string) { return this.service.findOneRole(id) }

  @Post('roles')
  @RequireAccess('roles', 'create')
  createRole(@Body() body: { name: string; description?: string }) {
    return this.service.createRole(body.name, body.description)
  }

  @Delete('roles/:id')
  @RequireAccess('roles', 'delete')
  deleteRole(@Param('id') id: string) { return this.service.deleteRole(id) }

  // ── Accesses ───────────────────────────────────────────────────────────────
  @Get('accesses')
  @RequireAccess('access', 'read')
  findAllAccesses() { return this.service.findAllAccesses() }

  @Post('accesses')
  @RequireAccess('access', 'create')
  createAccess(@Body() body: { resource: string; action: string; description?: string }) {
    return this.service.createAccess(body.resource, body.action, body.description)
  }

  @Delete('accesses/:id')
  @RequireAccess('access', 'delete')
  deleteAccess(@Param('id') id: string) { return this.service.deleteAccess(id) }

  // ── Role ↔ Access ──────────────────────────────────────────────────────────
  @Post('roles/:roleId/accesses/:accessId')
  @RequireAccess('roles', 'update')
  assignAccess(@Param('roleId') roleId: string, @Param('accessId') accessId: string) {
    return this.service.assignAccessToRole(roleId, accessId)
  }

  @Delete('roles/:roleId/accesses/:accessId')
  @RequireAccess('roles', 'update')
  removeAccess(@Param('roleId') roleId: string, @Param('accessId') accessId: string) {
    return this.service.removeAccessFromRole(roleId, accessId)
  }

  // ── User ↔ Role ────────────────────────────────────────────────────────────
  @Get('users/:userId/roles')
  @RequireAccess('users', 'read')
  getUserRoles(@Param('userId') userId: string) {
    return this.service.getUserRoles(userId)
  }

  @Post('users/:userId/roles/:roleId')
  @RequireAccess('users', 'update')
  assignRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.service.assignRoleToUser(userId, roleId)
  }

  @Delete('users/:userId/roles/:roleId')
  @RequireAccess('users', 'update')
  removeRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.service.removeRoleFromUser(userId, roleId)
  }
}
