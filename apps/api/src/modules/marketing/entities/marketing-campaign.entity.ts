import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export type MarketingCampaignStatus = 'draft' | 'queued' | 'sent' | 'failed'
export type MarketingCampaignKind = 'internal_update' | 'release_note' | 'operational_notice'

@Entity('marketing_campaigns')
export class MarketingCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 160 })
  title: string

  @Column({ name: 'campaign_kind', type: 'varchar', length: 40, default: 'internal_update' })
  campaignKind: MarketingCampaignKind

  @Column({ name: 'from_name', length: 120 })
  fromName: string

  @Column({ name: 'from_email', length: 255 })
  fromEmail: string

  @Column({ length: 180 })
  subject: string

  @Column({ type: 'varchar', nullable: true, length: 220 })
  preheader: string | null

  @Column({ type: 'text' })
  body: string

  @Column({ name: 'cta_label', type: 'varchar', nullable: true, length: 80 })
  ctaLabel: string | null

  @Column({ name: 'cta_url', nullable: true, type: 'text' })
  ctaUrl: string | null

  @Column({ name: 'segment_ids', type: 'jsonb', default: () => "'[]'::jsonb" })
  segmentIds: string[]

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: MarketingCampaignStatus

  @Column({ name: 'scheduled_for', type: 'timestamptz', nullable: true })
  scheduledFor: Date | null

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null

  @Column({ name: 'last_error', nullable: true, type: 'text' })
  lastError: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
