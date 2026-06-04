import { NewsService } from './news.service';
export declare class NewsController {
    private readonly newsService;
    constructor(newsService: NewsService);
    getArticles(limit?: string, category?: string): Promise<import("./entities/rss-article.entity").RssArticle[]>;
    getFeeds(): Promise<import("./entities/rss-feed.entity").RssFeed[]>;
    createFeed(body: {
        name: string;
        url: string;
        category?: string;
    }): Promise<import("./entities/rss-feed.entity").RssFeed>;
    updateFeed(id: string, body: {
        name?: string;
        url?: string;
        category?: string;
        enabled?: boolean;
    }): Promise<import("./entities/rss-feed.entity").RssFeed>;
    deleteFeed(id: string): Promise<void>;
}
