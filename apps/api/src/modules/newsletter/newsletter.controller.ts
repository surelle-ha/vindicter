import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { NewsletterService } from './newsletter.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { AccessGuard } from '../../common/guards/access.guard'
import { RequireAccess } from '../../common/decorators/require-access.decorator'
import { IsEmail, IsOptional, IsString } from 'class-validator'

class SignupDto {
  @IsEmail() email: string
  @IsOptional() @IsString() accountType?: string
}

@Controller('newsletter')
export class NewsletterController {
  constructor(private service: NewsletterService) {}

  // ── Public endpoints ───────────────────────────────────────────────────────
  @Post('signups')
  upsertSignup(@Body() dto: SignupDto) {
    return this.service.upsertSignup(dto.email, dto.accountType)
  }

  @Get('signups/token/:token')
  findByToken(@Param('token') token: string) {
    return this.service.findSignupByToken(token)
  }

  @Get('updates/published')
  getPublished(@Query('limit') limit?: string) {
    return this.service.findPublishedUpdates(limit ? Number(limit) : undefined)
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────
  @Get('signups')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess('newsletter', 'read')
  findAllSignups() { return this.service.findAllSignups() }

  @Get('updates')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess('newsletter', 'read')
  findAllUpdates() { return this.service.findAllUpdates() }

  @Post('updates')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess('newsletter', 'create')
  createUpdate(@Body() body: any) { return this.service.createUpdate(body) }

  @Put('updates/:id')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess('newsletter', 'update')
  updateOne(@Param('id') id: string, @Body() body: any) {
    return this.service.updateOne(id, body)
  }

  @Delete('updates/:id')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess('newsletter', 'delete')
  removeUpdate(@Param('id') id: string) { return this.service.removeUpdate(id) }
}
