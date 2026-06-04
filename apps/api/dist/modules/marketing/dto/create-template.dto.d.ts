import type { MarketingCampaignKind } from '../entities/marketing-campaign.entity';
import type { MarketingTemplateStatus } from '../entities/marketing-template.entity';
export declare class CreateTemplateDto {
    name: string;
    campaignKind: MarketingCampaignKind;
    subject: string;
    preheader?: string;
    body: string;
    ctaLabel?: string;
    ctaUrl?: string;
    variableMap?: Record<string, string>;
    status?: MarketingTemplateStatus;
}
