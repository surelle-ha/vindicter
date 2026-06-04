import { MarketingCampaign, type MarketingCampaignKind } from './marketing-campaign.entity';
export type MarketingSendEventStatus = 'sent' | 'failed';
export declare class MarketingSendEvent {
    id: string;
    campaign: MarketingCampaign | null;
    campaignId: string | null;
    campaignTitle: string;
    campaignKind: MarketingCampaignKind;
    recipientsCount: number;
    testOnly: boolean;
    testEmail: string | null;
    messageId: string | null;
    status: MarketingSendEventStatus;
    error: string | null;
    sentAt: Date | null;
    createdAt: Date;
}
