import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common'
import { WorkspacesService } from './workspaces.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { RequireRoles } from '../../common/decorators/require-roles.decorator'

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly service: WorkspacesService) {}

  // ── Admin routes ───────────────────────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  findAllAdmin() {
    return this.service.findAllAdmin()
  }

  @Patch('admin/:id/plan')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  adminChangePlan(@Param('id') id: string, @Body() body: { planId: string }) {
    return this.service.adminChangePlan(id, body.planId)
  }

  // ── Invitation routes (static segments must come before :id routes) ────────

  @Get('invitations/me')
  getMyInvitations(@Request() req: any) {
    return this.service.getMyInvitations(req.user.id)
  }

  @Post('invitations/:invitationId/accept')
  acceptInvitation(@Request() req: any, @Param('invitationId') invitationId: string) {
    return this.service.respondToInvitation(invitationId, req.user.id, 'accept')
  }

  @Post('invitations/:invitationId/decline')
  declineInvitation(@Request() req: any, @Param('invitationId') invitationId: string) {
    return this.service.respondToInvitation(invitationId, req.user.id, 'decline')
  }

  // ── User routes ────────────────────────────────────────────────────────────

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAllForUser(req.user.id)
  }

  @Post()
  create(@Request() req: any, @Body() body: { name: string }) {
    return this.service.create(req.user.id, body.name)
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOne(id, req.user.id)
  }

  @Patch(':id')
  rename(@Request() req: any, @Param('id') id: string, @Body() body: { name: string }) {
    return this.service.rename(id, req.user.id, body.name)
  }

  @Delete(':id')
  delete(@Request() req: any, @Param('id') id: string) {
    return this.service.delete(id, req.user.id)
  }

  @Get(':id/subscription')
  getSubscription(@Request() req: any, @Param('id') id: string) {
    return this.service.getSubscription(id, req.user.id)
  }

  @Post(':id/invitations')
  sendInvitation(@Request() req: any, @Param('id') id: string, @Body() body: { email: string }) {
    return this.service.sendInvitation(id, req.user.id, body.email)
  }

  @Delete(':id/members/:userId')
  removeMember(@Request() req: any, @Param('id') id: string, @Param('userId') userId: string) {
    return this.service.removeMember(id, req.user.id, userId)
  }
}
