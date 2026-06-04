import { RssFeed } from './rss-feed.entity';
export declare class RssArticle {
    id: string;
    feed: RssFeed;
    feedId: string;
    feedName: string;
    title: string;
    link: string;
    summary: string | null;
    publishedAt: Date | null;
    fetchedAt: Date;
}
