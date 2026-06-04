import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { NewsService } from './news.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { RequireRoles } from '../../common/decorators/require-roles.decorator'

@Controller('news')
@UseGuards(JwtAuthGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get('articles')
  getArticles(
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ) {
    return this.newsService.findArticles(limit ? Number(limit) : 60, category)
  }

  @Get('feeds')
  getFeeds() {
    return this.newsService.findAllFeeds()
  }

  @Post('feeds')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  createFeed(@Body() body: { name: string; url: string; category?: string }) {
    return this.newsService.createFeed(body.name, body.url, body.category)
  }

  @Patch('feeds/:id')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  updateFeed(
    @Param('id') id: string,
    @Body() body: { name?: string; url?: string; category?: string; enabled?: boolean },
  ) {
    return this.newsService.updateFeed(id, body)
  }

  @Delete('feeds/:id')
  @UseGuards(RolesGuard)
  @RequireRoles('admin')
  deleteFeed(@Param('id') id: string) {
    return this.newsService.deleteFeed(id)
  }
}
