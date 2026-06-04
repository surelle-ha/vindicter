import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SendCampaignDto } from './dto/send-campaign.dto';
import { MarketingService } from './marketing.service';
import type { MarketingCampaignKind } from './entities/marketing-campaign.entity';
export declare class MarketingController {
    private readonly service;
    constructor(service: MarketingService);
    summary(): Promise<{
        segments: number;
        contacts: number;
        campaigns: number;
        templates: number;
        sentEvents: number;
        smtp: {
            configured: boolean;
            host: string | null;
            port: number | null;
            secure: boolean;
            fromEmail: string | null;
            fromName: string | null;
        };
    }>;
    findSegments(): Promise<import("./entities/marketing-segment.entity").MarketingSegment[]>;
    createSegment(dto: CreateSegmentDto): Promise<import("./entities/marketing-segment.entity").MarketingSegment>;
    updateSegment(id: string, dto: Partial<CreateSegmentDto>): Promise<import("./entities/marketing-segment.entity").MarketingSegment>;
    removeSegment(id: string): Promise<void>;
    findContacts(): Promise<import("./entities/marketing-contact.entity").MarketingContact[]>;
    findTemplates(kind?: MarketingCampaignKind): Promise<import("./entities/marketing-template.entity").MarketingTemplate[]>;
    createTemplate(dto: CreateTemplateDto): Promise<import("./entities/marketing-template.entity").MarketingTemplate>;
    updateTemplate(id: string, dto: Partial<CreateTemplateDto>): Promise<import("./entities/marketing-template.entity").MarketingTemplate>;
    removeTemplate(id: string): Promise<void>;
    createContact(dto: CreateContactDto): Promise<import("./entities/marketing-contact.entity").MarketingContact>;
    updateContact(id: string, dto: Partial<CreateContactDto>): Promise<import("./entities/marketing-contact.entity").MarketingContact>;
    removeContact(id: string): Promise<void>;
    findCampaigns(): Promise<import("./entities/marketing-campaign.entity").MarketingCampaign[]>;
    findSendHistory(): Promise<import("./entities/marketing-send-event.entity").MarketingSendEvent[]>;
    createCampaign(dto: CreateCampaignDto): Promise<import("./entities/marketing-campaign.entity").MarketingCampaign>;
    updateCampaign(id: string, dto: Partial<CreateCampaignDto>): Promise<import("./entities/marketing-campaign.entity").MarketingCampaign>;
    sendCampaign(id: string, dto: SendCampaignDto): Promise<{
        recipients: number;
        messageId: string;
        testOnly: boolean;
    }>;
}
