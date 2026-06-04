import { RssArticle } from './rss-article.entity';
export declare class RssFeed {
    id: string;
    name: string;
    url: string;
    category: string;
    enabled: boolean;
    articles: RssArticle[];
    createdAt: Date;
    updatedAt: Date;
}
