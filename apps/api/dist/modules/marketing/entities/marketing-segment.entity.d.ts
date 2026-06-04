import { MarketingContact } from './marketing-contact.entity';
export type MarketingSegmentStatus = 'active' | 'draft' | 'paused';
export declare class MarketingSegment {
    id: string;
    name: string;
    source: string;
    status: MarketingSegmentStatus;
    ownerTeam: string;
    createdAt: Date;
    updatedAt: Date;
    contacts: MarketingContact[];
}
