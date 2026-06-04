import type { MarketingCampaignKind } from '../entities/marketing-campaign.entity';
export declare class CreateCampaignDto {
    title: string;
    campaignKind?: MarketingCampaignKind;
    fromName: string;
    fromEmail: string;
    subject: string;
    preheader?: string;
    body: string;
    ctaLabel?: string;
    ctaUrl?: string;
    segmentIds: string[];
    scheduledFor?: string;
}
