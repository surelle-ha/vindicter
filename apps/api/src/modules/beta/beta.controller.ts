import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { BetaService } from './beta.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { AccessGuard } from '../../common/guards/access.guard'
import { RequireAccess } from '../../common/decorators/require-access.decorator'

@Controller('beta')
export class BetaController {
  constructor(private service: BetaService) {}

  @Throttle({ global: { ttl: 60_000, limit: 3 } })
  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Get()
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess('beta', 'read')
  findAll() { return this.service.findAll() }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess('beta', 'update')
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.service.updateStatus(id, status)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess('beta', 'delete')
  remove(@Param('id') id: string) { return this.service.remove(id) }
}
