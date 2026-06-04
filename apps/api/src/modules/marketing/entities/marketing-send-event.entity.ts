import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { MarketingCampaign, type MarketingCampaignKind } from './marketing-campaign.entity'

export type MarketingSendEventStatus = 'sent' | 'failed'

@Entity('marketing_send_events')
export class MarketingSendEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => MarketingCampaign, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'campaign_id' })
  campaign: MarketingCampaign | null

  @Column({ name: 'campaign_id', type: 'uuid', nullable: true })
  campaignId: string | null

  @Column({ name: 'campaign_title', length: 160 })
  campaignTitle: string

  @Column({ name: 'campaign_kind', type: 'varchar', length: 40 })
  campaignKind: MarketingCampaignKind

  @Column({ name: 'recipients_count', type: 'integer', default: 0 })
  recipientsCount: number

  @Column({ name: 'test_only', default: false })
  testOnly: boolean

  @Column({ name: 'test_email', type: 'varchar', nullable: true, length: 255 })
  testEmail: string | null

  @Column({ name: 'message_id', type: 'varchar', nullable: true, length: 255 })
  messageId: string | null

  @Column({ type: 'varchar', length: 20 })
  status: MarketingSendEventStatus

  @Column({ nullable: true, type: 'text' })
  error: string | null

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
