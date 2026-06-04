import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { IsString, MaxLength } from 'class-validator'

class UpdateProfileDto {
  @IsString() @MaxLength(100) displayName: string
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // 5 login attempts per minute per IP
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: any) {
    const profile = await this.auth.me(user.id)
    return { ...profile, roles: user.roles ?? [], accesses: user.accesses ?? [] }
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.auth.updateDisplayName(user.id, dto.displayName)
  }
}
