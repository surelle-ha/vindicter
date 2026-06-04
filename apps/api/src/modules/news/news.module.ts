import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NewsService } from './news.service'
import { NewsController } from './news.controller'
import { RssFeed } from './entities/rss-feed.entity'
import { RssArticle } from './entities/rss-article.entity'

@Module({
  imports: [TypeOrmModule.forFeature([RssFeed, RssArticle])],
  controllers: [NewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
