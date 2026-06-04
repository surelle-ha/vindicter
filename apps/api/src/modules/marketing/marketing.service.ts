import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { MarketingCampaign } from './entities/marketing-campaign.entity'
import { MarketingContact } from './entities/marketing-contact.entity'
import { MarketingSegment } from './entities/marketing-segment.entity'
import { MarketingSendEvent } from './entities/marketing-send-event.entity'
import { MarketingTemplate } from './entities/marketing-template.entity'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { CreateContactDto } from './dto/create-contact.dto'
import { CreateSegmentDto } from './dto/create-segment.dto'
import { CreateTemplateDto } from './dto/create-template.dto'
import { SendCampaignDto } from './dto/send-campaign.dto'
import { SmtpService } from './smtp.service'
import type { MarketingCampaignKind } from './entities/marketing-campaign.entity'

@Injectable()
export class MarketingService {
  constructor(
    @InjectRepository(MarketingSegment) private segmentRepo: Repository<MarketingSegment>,
    @InjectRepository(MarketingContact) private contactRepo: Repository<MarketingContact>,
    @InjectRepository(MarketingCampaign) private campaignRepo: Repository<MarketingCampaign>,
    @InjectRepository(MarketingTemplate) private templateRepo: Repository<MarketingTemplate>,
    @InjectRepository(MarketingSendEvent) private sendEventRepo: Repository<MarketingSendEvent>,
    private smtp: SmtpService,
  ) {}

  async summary() {
    const [segments, contacts, campaigns, templates, sentEvents] = await Promise.all([
      this.segmentRepo.count(),
      this.contactRepo.count({ where: { status: 'subscribed' } }),
      this.campaignRepo.count(),
      this.templateRepo.count({ where: { status: 'active' } }),
      this.sendEventRepo.count({ where: { status: 'sent' } }),
    ])

    return {
      segments,
      contacts,
      campaigns,
      templates,
      sentEvents,
      smtp: this.smtp.configSummary(),
    }
  }

  findSegments() {
    return this.segmentRepo.find({
      relations: ['contacts'],
      order: { updatedAt: 'DESC' },
    })
  }

  createSegment(dto: CreateSegmentDto) {
    const segment = this.segmentRepo.create({
      name: dto.name.trim(),
      source: dto.source?.trim() || 'Internal list',
      ownerTeam: dto.ownerTeam?.trim() || 'Marketing',
      status: dto.status ?? 'draft',
    })
    return this.segmentRepo.save(segment)
  }

  async updateSegment(id: string, dto: Partial<CreateSegmentDto>) {
    const segment = await this.segmentRepo.findOneBy({ id })
    if (!segment) throw new NotFoundException('Distribution list not found')
    Object.assign(segment, {
      ...dto,
      name: dto.name?.trim() ?? segment.name,
      source: dto.source?.trim() ?? segment.source,
      ownerTeam: dto.ownerTeam?.trim() ?? segment.ownerTeam,
    })
    return this.segmentRepo.save(segment)
  }

  async removeSegment(id: string) {
    const segment = await this.segmentRepo.findOneBy({ id })
    if (!segment) throw new NotFoundException('Distribution list not found')
    await this.segmentRepo.remove(segment)
  }

  findContacts() {
    return this.contactRepo.find({
      relations: ['segment'],
      order: { updatedAt: 'DESC' },
    })
  }

  async createContact(dto: CreateContactDto) {
    const segment = dto.segmentId ? await this.segmentRepo.findOneBy({ id: dto.segmentId }) : null
    if (dto.segmentId && !segment) throw new NotFoundException('Distribution list not found')

    const contact = this.contactRepo.create({
      email: dto.email.trim().toLowerCase(),
      name: dto.name?.trim() || null,
      company: dto.company?.trim() || null,
      status: dto.status ?? 'subscribed',
      segment,
      segmentId: segment?.id ?? null,
    })
    return this.contactRepo.save(contact)
  }

  async updateContact(id: string, dto: Partial<CreateContactDto>) {
    const contact = await this.contactRepo.findOne({ where: { id }, relations: ['segment'] })
    if (!contact) throw new NotFoundException('Contact not found')

    if (dto.segmentId !== undefined) {
      const segment = dto.segmentId ? await this.segmentRepo.findOneBy({ id: dto.segmentId }) : null
      if (dto.segmentId && !segment) throw new NotFoundException('Distribution list not found')
      contact.segment = segment
      contact.segmentId = segment?.id ?? null
    }

    if (dto.email) contact.email = dto.email.trim().toLowerCase()
    if (dto.name !== undefined) contact.name = dto.name?.trim() || null
    if (dto.company !== undefined) contact.company = dto.company?.trim() || null
    if (dto.status) contact.status = dto.status

    return this.contactRepo.save(contact)
  }

  async removeContact(id: string) {
    const contact = await this.contactRepo.findOneBy({ id })
    if (!contact) throw new NotFoundException('Contact not found')
    await this.contactRepo.remove(contact)
  }

  findTemplates(kind?: MarketingCampaignKind) {
    return this.templateRepo.find({
      where: kind ? { campaignKind: kind } : undefined,
      order: { updatedAt: 'DESC' },
    })
  }

  createTemplate(dto: CreateTemplateDto) {
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
    })
    return this.templateRepo.save(template)
  }

  async updateTemplate(id: string, dto: Partial<CreateTemplateDto>) {
    const template = await this.templateRepo.findOneBy({ id })
    if (!template) throw new NotFoundException('Template not found')
    Object.assign(template, {
      ...dto,
      name: dto.name?.trim() ?? template.name,
      subject: dto.subject?.trim() ?? template.subject,
      preheader: dto.preheader !== undefined ? dto.preheader?.trim() || null : template.preheader,
      ctaLabel: dto.ctaLabel !== undefined ? dto.ctaLabel?.trim() || null : template.ctaLabel,
      ctaUrl: dto.ctaUrl !== undefined ? dto.ctaUrl?.trim() || null : template.ctaUrl,
      variableMap: dto.variableMap ?? template.variableMap,
    })
    return this.templateRepo.save(template)
  }

  async removeTemplate(id: string) {
    const template = await this.templateRepo.findOneBy({ id })
    if (!template) throw new NotFoundException('Template not found')
    await this.templateRepo.remove(template)
  }

  findCampaigns() {
    return this.campaignRepo.find({ order: { updatedAt: 'DESC' } })
  }

  findSendHistory() {
    return this.sendEventRepo.find({ order: { createdAt: 'DESC' }, take: 100 })
  }

  createCampaign(dto: CreateCampaignDto) {
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
    })
    return this.campaignRepo.save(campaign)
  }

  async updateCampaign(id: string, dto: Partial<CreateCampaignDto>) {
    const campaign = await this.campaignRepo.findOneBy({ id })
    if (!campaign) throw new NotFoundException('Campaign not found')
    Object.assign(campaign, {
      ...dto,
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : campaign.scheduledFor,
    })
    return this.campaignRepo.save(campaign)
  }

  async sendCampaign(id: string, dto: SendCampaignDto) {
    const campaign = await this.campaignRepo.findOneBy({ id })
    if (!campaign) throw new NotFoundException('Campaign not found')

    const recipientState = await this.resolveRecipients(campaign.segmentIds, dto)
    const recipients = recipientState.emails

    if (!recipients.length) {
      throw new BadRequestException('No recipients available for this send.')
    }

    try {
      const result = await this.smtp.send({
        fromName: campaign.fromName,
        fromEmail: campaign.fromEmail,
        to: recipients,
        subject: this.resolveTemplateTokens(campaign.subject, recipientState.context),
        text: this.renderText(campaign, recipientState.context),
        html: this.renderHtml(campaign, recipientState.context),
      })

      await this.recordSendEvent(campaign, {
        recipientsCount: recipients.length,
        testOnly: Boolean(dto.testOnly),
        testEmail: dto.testOnly ? dto.testEmail ?? null : null,
        messageId: result.messageId ?? null,
        status: 'sent',
        sentAt: new Date(),
      })

      if (!dto.testOnly) {
        campaign.status = 'sent'
        campaign.sentAt = new Date()
        campaign.lastError = null
        await this.campaignRepo.save(campaign)
      }

      return {
        recipients: recipients.length,
        messageId: result.messageId,
        testOnly: Boolean(dto.testOnly),
      }
    } catch (error) {
      await this.recordSendEvent(campaign, {
        recipientsCount: recipients.length,
        testOnly: Boolean(dto.testOnly),
        testEmail: dto.testOnly ? dto.testEmail ?? null : null,
        messageId: null,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Send failed',
        sentAt: null,
      })
      if (!dto.testOnly) campaign.status = 'failed'
      campaign.lastError = error instanceof Error ? error.message : 'Send failed'
      await this.campaignRepo.save(campaign)
      throw error
    }
  }

  private async resolveRecipients(segmentIds: string[], dto: SendCampaignDto) {
    const segments = segmentIds.length ? await this.segmentRepo.findBy({ id: In(segmentIds) }) : []
    const emails = dto.testOnly
      ? [dto.testEmail].filter(Boolean) as string[]
      : await this.findRecipientEmails(segmentIds)

    return {
      emails,
      context: {
        'distribution.names': segments.map((segment) => segment.name).join(', '),
        'distribution.count': String(segments.length),
        'distribution.ownerTeams': [...new Set(segments.map((segment) => segment.ownerTeam))].join(', '),
        'recipients.count': String(emails.length),
        'system.date': new Date().toISOString().slice(0, 10),
      },
    }
  }

  private async findRecipientEmails(segmentIds: string[]) {
    const contacts = await this.contactRepo.find({
      where: { status: 'subscribed', segmentId: In(segmentIds) },
      select: ['email'],
    })
    return [...new Set(contacts.map((contact) => contact.email))]
  }

  private renderText(campaign: MarketingCampaign, context: Record<string, string>) {
    return [
      campaign.preheader ? this.resolveTemplateTokens(campaign.preheader, context) : null,
      this.resolveTemplateTokens(campaign.body, context),
      campaign.ctaLabel && campaign.ctaUrl ? `${this.resolveTemplateTokens(campaign.ctaLabel, context)}: ${this.resolveTemplateTokens(campaign.ctaUrl, context)}` : null,
    ].filter(Boolean).join('\n\n')
  }

  private renderHtml(campaign: MarketingCampaign, context: Record<string, string>) {
    const paragraphs = campaign.body
      .split('\n')
      .filter(Boolean)
      .map((line) => `<p>${this.escapeHtml(this.resolveTemplateTokens(line, context))}</p>`)
      .join('')

    const cta = campaign.ctaLabel && campaign.ctaUrl
      ? `<p><a href="${this.escapeHtml(this.resolveTemplateTokens(campaign.ctaUrl, context))}" style="display:inline-block;background:#111215;color:#ffffff;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:700;">${this.escapeHtml(this.resolveTemplateTokens(campaign.ctaLabel, context))}</a></p>`
      : ''

    return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;color:#15171c;background:#f7f8fb;padding:24px;"><main style="max-width:640px;margin:0 auto;background:#ffffff;padding:28px;border-radius:8px;"><h1 style="margin-top:0;">${this.escapeHtml(this.resolveTemplateTokens(campaign.title, context))}</h1>${paragraphs}${cta}</main></body></html>`
  }

  private resolveTemplateTokens(value: string, context: Record<string, string>) {
    return value.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key: string) => context[key] ?? `{{${key}}}`)
  }

  private recordSendEvent(campaign: MarketingCampaign, payload: {
    recipientsCount: number
    testOnly: boolean
    testEmail: string | null
    messageId: string | null
    status: 'sent' | 'failed'
    error?: string
    sentAt: Date | null
  }) {
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
    }))
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
  }
}
