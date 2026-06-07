import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { PricingService } from './pricing.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { RequireRoles } from '../../common/decorators/require-roles.decorator'

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  findAll() {
    return this.pricingService.findAll(false)
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoles('admin')
  findAllAdmin() {
    return this.pricingService.findAll(true)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoles('admin')
  create(@Body() body: { name: string; description?: string; tokenLimit: number; seatLimit?: number; projectLimit?: number; priceUsd: number; sortOrder?: number }) {
    return this.pricingService.create(body)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoles('admin')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ name: string; description: string | null; tokenLimit: number; seatLimit: number; projectLimit: number; priceUsd: number; isActive: boolean; sortOrder: number }>,
  ) {
    return this.pricingService.update(id, body)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoles('admin')
  remove(@Param('id') id: string) {
    return this.pricingService.remove(id)
  }
}
