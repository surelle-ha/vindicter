import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { SupportService } from './support.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { AccessGuard } from '../../common/guards/access.guard'
import { RequireAccess } from '../../common/decorators/require-access.decorator'

@Controller('support')
export class SupportController {
  constructor(private service: SupportService) {}

  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @Post('tickets')
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess('support', 'read')
  findAll() { return this.service.findAll() }

  @Patch('tickets/:id/status')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess('support', 'update')
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.service.updateStatus(id, status)
  }

  @Delete('tickets/:id')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess('support', 'delete')
  remove(@Param('id') id: string) { return this.service.remove(id) }
}
