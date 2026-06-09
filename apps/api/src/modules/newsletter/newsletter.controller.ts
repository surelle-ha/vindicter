import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import type { FastifyReply } from 'fastify'
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
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @Post('signups')
  upsertSignup(@Body() dto: SignupDto) {
    return this.service.upsertSignup(dto.email, dto.accountType)
  }

  @Get('signups/token/:token')
  findByToken(@Param('token') token: string) {
    return this.service.findSignupByToken(token)
  }

  @Get('signups/download/:token')
  async downloadByToken(@Param('token') token: string, @Res() res: FastifyReply) {
    const url = await this.service.getDownloadUrlForToken(token)
    const safeUrl = encodeURI(url)
    res.type('text/html; charset=utf-8').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Downloading Vindicter…</title>
  <script>window.location.href=${JSON.stringify(safeUrl)}</script>
</head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#0f1012;color:#e4e4e7;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;">
  <div>
    <p style="font-size:18px;font-weight:700;margin:0 0 12px;">Your download is starting…</p>
    <p style="font-size:13px;color:#9ca3af;margin:0;">
      If it doesn't begin automatically,
      <a href="${safeUrl}" style="color:#6366f1;text-decoration:underline;">click here</a>.
    </p>
  </div>
</body>
</html>`)
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────
  @Get('signups')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess('newsletter', 'read')
  findAllSignups() { return this.service.findAllSignups() }
}
