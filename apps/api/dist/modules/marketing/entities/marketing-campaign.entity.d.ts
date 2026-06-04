export type MarketingCampaignStatus = 'draft' | 'queued' | 'sent' | 'failed';
export type MarketingCampaignKind = 'internal_update' | 'release_note' | 'operational_notice';
export declare class MarketingCampaign {
    id: string;
    title: string;
    campaignKind: MarketingCampaignKind;
    fromName: string;
    fromEmail: string;
    subject: string;
    preheader: string | null;
    body: string;
    ctaLabel: string | null;
    ctaUrl: string | null;
    segmentIds: string[];
    status: MarketingCampaignStatus;
    scheduledFor: Date | null;
    sentAt: Date | null;
    lastError: string | null;
    createdAt: Date;
    updatedAt: Date;
}
