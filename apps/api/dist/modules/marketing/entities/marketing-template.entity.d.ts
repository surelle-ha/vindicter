import type { MarketingCampaignKind } from './marketing-campaign.entity';
export type MarketingTemplateStatus = 'draft' | 'active' | 'archived';
export declare class MarketingTemplate {
    id: string;
    name: string;
    campaignKind: MarketingCampaignKind;
    subject: string;
    preheader: string | null;
    body: string;
    ctaLabel: string | null;
    ctaUrl: string | null;
    variableMap: Record<string, string>;
    status: MarketingTemplateStatus;
    createdAt: Date;
    updatedAt: Date;
}
