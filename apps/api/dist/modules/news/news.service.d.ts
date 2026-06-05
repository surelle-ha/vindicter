import { Repository } from 'typeorm';
import { RssFeed } from './entities/rss-feed.entity';
import { RssArticle } from './entities/rss-article.entity';
export declare class NewsService {
    private feedRepo;
    private articleRepo;
    constructor(feedRepo: Repository<RssFeed>, articleRepo: Repository<RssArticle>);
    findAllFeeds(): Promise<RssFeed[]>;
    createFeed(name: string, url: string, category?: string): Promise<RssFeed>;
    updateFeed(id: string, partial: Partial<Pick<RssFeed, 'name' | 'url' | 'category' | 'enabled'>>): Promise<RssFeed>;
    deleteFeed(id: string): Promise<void>;
    findArticles(limit?: number, category?: string): Promise<RssArticle[]>;
    upsertArticle(dto: {
        feedId: string;
        feedName: string;
        title: string;
        link: string;
        summary?: string | null;
        publishedAt?: Date | null;
    }): Promise<void>;
    upsertArticles(articles: any[]): Promise<{
        synced: number;
        total: number;
    }>;
}
