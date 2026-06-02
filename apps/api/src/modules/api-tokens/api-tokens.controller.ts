import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiTokensService } from './api-tokens.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { AccessGuard } from '../../common/guards/access.guard'
import { RequireAccess } from '../../common/decorators/require-access.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@Controller('api-tokens')
@UseGuards(JwtAuthGuard, AccessGuard)
export class ApiTokensController {
  constructor(private service: ApiTokensService) {}

  @Post()
  @RequireAccess('api-tokens', 'create')
  create(
    @CurrentUser() user: any,
    @Body('name') name: string,
    @Body('expiresAt') expiresAt?: string,
  ) {
    return this.service.create(user.id, name, expiresAt ? new Date(expiresAt) : undefined)
  }

  @Get()
  @RequireAccess('api-tokens', 'read')
  findAll(@CurrentUser() user: any) {
    return this.service.findByUser(user.id)
  }

  @Delete(':id')
  @RequireAccess('api-tokens', 'delete')
  revoke(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.revoke(user.id, id)
  }
}
