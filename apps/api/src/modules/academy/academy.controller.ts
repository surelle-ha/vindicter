import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { AcademyService } from './academy.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@Controller('academy')
@UseGuards(JwtAuthGuard)
export class AcademyController {
  constructor(private readonly service: AcademyService) {}

  // ── Progress ────────────────────────────────────────────────────────────────

  @Get('progress')
  getProgress(@CurrentUser() user: any) {
    return this.service.getProgress(user.id)
  }

  @Post('progress/:lessonId')
  upsertProgress(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
    @Body('completedAt') completedAt?: string,
  ) {
    return this.service.upsertProgress(
      user.id,
      lessonId,
      completedAt ? new Date(completedAt) : undefined,
    )
  }

  @Delete('progress/:lessonId')
  deleteProgress(@CurrentUser() user: any, @Param('lessonId') lessonId: string) {
    return this.service.deleteProgress(user.id, lessonId)
  }

  // ── Chat sessions ───────────────────────────────────────────────────────────

  @Get('sessions/:lessonId')
  getSession(@CurrentUser() user: any, @Param('lessonId') lessonId: string) {
    return this.service.getSession(user.id, lessonId)
  }

  @Put('sessions/:lessonId')
  upsertSession(
    @CurrentUser() user: any,
    @Param('lessonId') lessonId: string,
    @Body('messages') messages: any[],
  ) {
    return this.service.upsertSession(user.id, lessonId, messages ?? [])
  }

  @Delete('sessions/:lessonId')
  deleteSession(@CurrentUser() user: any, @Param('lessonId') lessonId: string) {
    return this.service.deleteSession(user.id, lessonId)
  }
}
