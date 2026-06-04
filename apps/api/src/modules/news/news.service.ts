import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RssFeed } from './entities/rss-feed.entity'
import { RssArticle } from './entities/rss-article.entity'

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(RssFeed)    private feedRepo:    Repository<RssFeed>,
    @InjectRepository(RssArticle) private articleRepo: Repository<RssArticle>,
  ) {}

  findAllFeeds() {
    return this.feedRepo.find({ order: { createdAt: 'ASC' } })
  }

  async createFeed(name: string, url: string, category = 'general') {
    return this.feedRepo.save(this.feedRepo.create({ name, url, category }))
  }

  async updateFeed(id: string, partial: Partial<Pick<RssFeed, 'name' | 'url' | 'category' | 'enabled'>>) {
    const feed = await this.feedRepo.findOneBy({ id })
    if (!feed) throw new NotFoundException('Feed not found')
    Object.assign(feed, partial)
    return this.feedRepo.save(feed)
  }

  async deleteFeed(id: string) {
    const feed = await this.feedRepo.findOneBy({ id })
    if (!feed) throw new NotFoundException('Feed not found')
    await this.feedRepo.remove(feed)
  }

  findArticles(limit = 60, category?: string) {
    const qb = this.articleRepo.createQueryBuilder('a')
      .orderBy('a.publishedAt', 'DESC')
      .limit(limit)
    if (category && category !== 'all') {
      qb.innerJoin('a.feed', 'f').where('f.category = :category', { category })
    }
    return qb.getMany()
  }

  async upsertArticle(dto: {
    feedId: string; feedName: string; title: string; link: string
    summary?: string | null; publishedAt?: Date | null
  }) {
    await this.articleRepo.upsert(
      { ...dto, fetchedAt: new Date() },
      { conflictPaths: ['link'], skipUpdateIfNoValuesChanged: true },
    )
  }
}
