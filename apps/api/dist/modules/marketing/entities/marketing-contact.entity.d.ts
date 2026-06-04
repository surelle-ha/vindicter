import { MarketingSegment } from './marketing-segment.entity';
export type MarketingContactStatus = 'subscribed' | 'bounced' | 'unsubscribed';
export declare class MarketingContact {
    id: string;
    email: string;
    name: string | null;
    company: string | null;
    status: MarketingContactStatus;
    lastEngagedAt: Date | null;
    segment: MarketingSegment | null;
    segmentId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
