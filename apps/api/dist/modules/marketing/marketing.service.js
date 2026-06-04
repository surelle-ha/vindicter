"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const marketing_campaign_entity_1 = require("./entities/marketing-campaign.entity");
const marketing_contact_entity_1 = require("./entities/marketing-contact.entity");
const marketing_segment_entity_1 = require("./entities/marketing-segment.entity");
const marketing_send_event_entity_1 = require("./entities/marketing-send-event.entity");
const marketing_template_entity_1 = require("./entities/marketing-template.entity");
const smtp_service_1 = require("./smtp.service");
let MarketingService = class MarketingService {
    constructor(segmentRepo, contactRepo, campaignRepo, templateRepo, sendEventRepo, smtp) {
        this.segmentRepo = segmentRepo;
        this.contactRepo = contactRepo;
        this.campaignRepo = campaignRepo;
        this.templateRepo = templateRepo;
        this.sendEventRepo = sendEventRepo;
        this.smtp = smtp;
    }
    async summary() {
        const [segments, contacts, campaigns, templates, sentEvents] = await Promise.all([
            this.segmentRepo.count(),
            this.contactRepo.count({ where: { status: 'subscribed' } }),
            this.campaignRepo.count(),
            this.templateRepo.count({ where: { status: 'active' } }),
            this.sendEventRepo.count({ where: { status: 'sent' } }),
        ]);
        return {
            segments,
            contacts,
            campaigns,
            templates,
            sentEvents,
            smtp: this.smtp.configSummary(),
        };
    }
    findSegments() {
        return this.segmentRepo.find({
            relations: ['contacts'],
            order: { updatedAt: 'DESC' },
        });
    }
    createSegment(dto) {
        const segment = this.segmentRepo.create({
            name: dto.name.trim(),
            source: dto.source?.trim() || 'Internal list',
            ownerTeam: dto.ownerTeam?.trim() || 'Marketing',
            status: dto.status ?? 'draft',
        });
        return this.segmentRepo.save(segment);
    }
    async updateSegment(id, dto) {
        const segment = await this.segmentRepo.findOneBy({ id });
        if (!segment)
            throw new common_1.NotFoundException('Distribution list not found');
        Object.assign(segment, {
            ...dto,
            name: dto.name?.trim() ?? segment.name,
            source: dto.source?.trim() ?? segment.source,
            ownerTeam: dto.ownerTeam?.trim() ?? segment.ownerTeam,
        });
        return this.segmentRepo.save(segment);
    }
    async removeSegment(id) {
        const segment = await this.segmentRepo.findOneBy({ id });
        if (!segment)
            throw new common_1.NotFoundException('Distribution list not found');
        await this.segmentRepo.remove(segment);
    }
    findContacts() {
        return this.contactRepo.find({
            relations: ['segment'],
            order: { updatedAt: 'DESC' },
        });
    }
    async createContact(dto) {
        const segment = dto.segmentId ? await this.segmentRepo.findOneBy({ id: dto.segmentId }) : null;
        if (dto.segmentId && !segment)
            throw new common_1.NotFoundException('Distribution list not found');
        const contact = this.contactRepo.create({
            email: dto.email.trim().toLowerCase(),
            name: dto.name?.trim() || null,
            company: dto.company?.trim() || null,
            status: dto.status ?? 'subscribed',
            segment,
            segmentId: segment?.id ?? null,
        });
        return this.contactRepo.save(contact);
    }
    async updateContact(id, dto) {
        const contact = await this.contactRepo.findOne({ where: { id }, relations: ['segment'] });
        if (!contact)
            throw new common_1.NotFoundException('Contact not found');
        if (dto.segmentId !== undefined) {
            const segment = dto.segmentId ? await this.segmentRepo.findOneBy({ id: dto.segmentId }) : null;
            if (dto.segmentId && !segment)
                throw new common_1.NotFoundException('Distribution list not found');
            contact.segment = segment;
            contact.segmentId = segment?.id ?? null;
        }
        if (dto.email)
            contact.email = dto.email.trim().toLowerCase();
        if (dto.name !== undefined)
            contact.name = dto.name?.trim() || null;
        if (dto.company !== undefined)
            contact.company = dto.company?.trim() || null;
        if (dto.status)
            contact.status = dto.status;
        return this.contactRepo.save(contact);
    }
    async removeContact(id) {
        const contact = await this.contactRepo.findOneBy({ id });
        if (!contact)
            throw new common_1.NotFoundException('Contact not found');
        await this.contactRepo.remove(contact);
    }
    findTemplates(kind) {
        return this.templateRepo.find({
            where: kind ? { campaignKind: kind } : undefined,
            order: { updatedAt: 'DESC' },
        });
    }
    createTemplate(dto) {
        const template = this.templateRepo.create({
            name: dto.name.trim(),
            campaignKind: dto.campaignKind,
            subject: dto.subject.trim(),
            preheader: dto.preheader?.trim() || null,
            body: dto.body,
            ctaLabel: dto.ctaLabel?.trim() || null,
            ctaUrl: dto.ctaUrl?.trim() || null,
            variableMap: dto.variableMap ?? {},
            status: dto.status ?? 'active',
        });
        return this.templateRepo.save(template);
    }
    async updateTemplate(id, dto) {
        const template = await this.templateRepo.findOneBy({ id });
        if (!template)
            throw new common_1.NotFoundException('Template not found');
        Object.assign(template, {
            ...dto,
            name: dto.name?.trim() ?? template.name,
            subject: dto.subject?.trim() ?? template.subject,
            preheader: dto.preheader !== undefined ? dto.preheader?.trim() || null : template.preheader,
            ctaLabel: dto.ctaLabel !== undefined ? dto.ctaLabel?.trim() || null : template.ctaLabel,
            ctaUrl: dto.ctaUrl !== undefined ? dto.ctaUrl?.trim() || null : template.ctaUrl,
            variableMap: dto.variableMap ?? template.variableMap,
        });
        return this.templateRepo.save(template);
    }
    async removeTemplate(id) {
        const template = await this.templateRepo.findOneBy({ id });
        if (!template)
            throw new common_1.NotFoundException('Template not found');
        await this.templateRepo.remove(template);
    }
    findCampaigns() {
        return this.campaignRepo.find({ order: { updatedAt: 'DESC' } });
    }
    findSendHistory() {
        return this.sendEventRepo.find({ order: { createdAt: 'DESC' }, take: 100 });
    }
    createCampaign(dto) {
        const campaign = this.campaignRepo.create({
            title: dto.title.trim(),
            campaignKind: dto.campaignKind ?? 'internal_update',
            fromName: dto.fromName.trim(),
            fromEmail: dto.fromEmail.trim().toLowerCase(),
            subject: dto.subject.trim(),
            preheader: dto.preheader?.trim() || null,
            body: dto.body,
            ctaLabel: dto.ctaLabel?.trim() || null,
            ctaUrl: dto.ctaUrl?.trim() || null,
            segmentIds: dto.segmentIds,
            scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        });
        return this.campaignRepo.save(campaign);
    }
    async updateCampaign(id, dto) {
        const campaign = await this.campaignRepo.findOneBy({ id });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        Object.assign(campaign, {
            ...dto,
            scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : campaign.scheduledFor,
        });
        return this.campaignRepo.save(campaign);
    }
    async sendCampaign(id, dto) {
        const campaign = await this.campaignRepo.findOneBy({ id });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        const recipientState = await this.resolveRecipients(campaign.segmentIds, dto);
        const recipients = recipientState.emails;
        if (!recipients.length) {
            throw new common_1.BadRequestException('No recipients available for this send.');
        }
        try {
            const result = await this.smtp.send({
                fromName: campaign.fromName,
                fromEmail: campaign.fromEmail,
                to: recipients,
                subject: this.resolveTemplateTokens(campaign.subject, recipientState.context),
                text: this.renderText(campaign, recipientState.context),
                html: this.renderHtml(campaign, recipientState.context),
            });
            await this.recordSendEvent(campaign, {
                recipientsCount: recipients.length,
                testOnly: Boolean(dto.testOnly),
                testEmail: dto.testOnly ? dto.testEmail ?? null : null,
                messageId: result.messageId ?? null,
                status: 'sent',
                sentAt: new Date(),
            });
            if (!dto.testOnly) {
                campaign.status = 'sent';
                campaign.sentAt = new Date();
                campaign.lastError = null;
                await this.campaignRepo.save(campaign);
            }
            return {
                recipients: recipients.length,
                messageId: result.messageId,
                testOnly: Boolean(dto.testOnly),
            };
        }
        catch (error) {
            await this.recordSendEvent(campaign, {
                recipientsCount: recipients.length,
                testOnly: Boolean(dto.testOnly),
                testEmail: dto.testOnly ? dto.testEmail ?? null : null,
                messageId: null,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Send failed',
                sentAt: null,
            });
            if (!dto.testOnly)
                campaign.status = 'failed';
            campaign.lastError = error instanceof Error ? error.message : 'Send failed';
            await this.campaignRepo.save(campaign);
            throw error;
        }
    }
    async resolveRecipients(segmentIds, dto) {
        const segments = segmentIds.length ? await this.segmentRepo.findBy({ id: (0, typeorm_2.In)(segmentIds) }) : [];
        const emails = dto.testOnly
            ? [dto.testEmail].filter(Boolean)
            : await this.findRecipientEmails(segmentIds);
        return {
            emails,
            context: {
                'distribution.names': segments.map((segment) => segment.name).join(', '),
                'distribution.count': String(segments.length),
                'distribution.ownerTeams': [...new Set(segments.map((segment) => segment.ownerTeam))].join(', '),
                'recipients.count': String(emails.length),
                'system.date': new Date().toISOString().slice(0, 10),
            },
        };
    }
    async findRecipientEmails(segmentIds) {
        const contacts = await this.contactRepo.find({
            where: { status: 'subscribed', segmentId: (0, typeorm_2.In)(segmentIds) },
            select: ['email'],
        });
        return [...new Set(contacts.map((contact) => contact.email))];
    }
    renderText(campaign, context) {
        return [
            campaign.preheader ? this.resolveTemplateTokens(campaign.preheader, context) : null,
            this.resolveTemplateTokens(campaign.body, context),
            campaign.ctaLabel && campaign.ctaUrl ? `${this.resolveTemplateTokens(campaign.ctaLabel, context)}: ${this.resolveTemplateTokens(campaign.ctaUrl, context)}` : null,
        ].filter(Boolean).join('\n\n');
    }
    renderHtml(campaign, context) {
        const paragraphs = campaign.body
            .split('\n')
            .filter(Boolean)
            .map((line) => `<p>${this.escapeHtml(this.resolveTemplateTokens(line, context))}</p>`)
            .join('');
        const cta = campaign.ctaLabel && campaign.ctaUrl
            ? `<p><a href="${this.escapeHtml(this.resolveTemplateTokens(campaign.ctaUrl, context))}" style="display:inline-block;background:#111215;color:#ffffff;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:700;">${this.escapeHtml(this.resolveTemplateTokens(campaign.ctaLabel, context))}</a></p>`
            : '';
        return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;color:#15171c;background:#f7f8fb;padding:24px;"><main style="max-width:640px;margin:0 auto;background:#ffffff;padding:28px;border-radius:8px;"><h1 style="margin-top:0;">${this.escapeHtml(this.resolveTemplateTokens(campaign.title, context))}</h1>${paragraphs}${cta}</main></body></html>`;
    }
    resolveTemplateTokens(value, context) {
        return value.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => context[key] ?? `{{${key}}}`);
    }
    recordSendEvent(campaign, payload) {
        return this.sendEventRepo.save(this.sendEventRepo.create({
            campaign,
            campaignId: campaign.id,
            campaignTitle: campaign.title,
            campaignKind: campaign.campaignKind,
            recipientsCount: payload.recipientsCount,
            testOnly: payload.testOnly,
            testEmail: payload.testEmail,
            messageId: payload.messageId,
            status: payload.status,
            error: payload.error ?? null,
            sentAt: payload.sentAt,
        }));
    }
    escapeHtml(value) {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }
};
exports.MarketingService = MarketingService;
exports.MarketingService = MarketingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(marketing_segment_entity_1.MarketingSegment)),
    __param(1, (0, typeorm_1.InjectRepository)(marketing_contact_entity_1.MarketingContact)),
    __param(2, (0, typeorm_1.InjectRepository)(marketing_campaign_entity_1.MarketingCampaign)),
    __param(3, (0, typeorm_1.InjectRepository)(marketing_template_entity_1.MarketingTemplate)),
    __param(4, (0, typeorm_1.InjectRepository)(marketing_send_event_entity_1.MarketingSendEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        smtp_service_1.SmtpService])
], MarketingService);
//# sourceMappingURL=marketing.service.js.map