import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { CorsService } from './cors.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { AccessGuard } from '../../common/guards/access.guard'
import { RequireAccess } from '../../common/decorators/require-access.decorator'

@Controller('cors')
@UseGuards(JwtAuthGuard, AccessGuard)
export class CorsController {
  constructor(private readonly service: CorsService) {}

  @Get()
  @RequireAccess('cors', 'read')
  findAll() { return this.service.findAll() }

  @Post()
  @RequireAccess('cors', 'create')
  create(@Body() body: { origin: string; label?: string }) {
    return this.service.create(body.origin, body.label)
  }

  @Patch(':id/toggle')
  @RequireAccess('cors', 'update')
  toggle(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    return this.service.toggle(id, body.enabled)
  }

  @Delete(':id')
  @RequireAccess('cors', 'delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
