export type NewsletterUpdateStatus = 'draft' | 'published' | 'archived';
export declare class NewsletterUpdate {
    id: string;
    title: string;
    summary: string | null;
    body: string;
    status: NewsletterUpdateStatus;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
