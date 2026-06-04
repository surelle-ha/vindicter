import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import type { MarketingCampaignKind } from './marketing-campaign.entity'

export type MarketingTemplateStatus = 'draft' | 'active' | 'archived'

@Entity('marketing_templates')
export class MarketingTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 140 })
  name: string

  @Column({ name: 'campaign_kind', type: 'varchar', length: 40 })
  campaignKind: MarketingCampaignKind

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

  @Column({ name: 'variable_map', type: 'jsonb', default: () => "'{}'::jsonb" })
  variableMap: Record<string, string>

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: MarketingTemplateStatus

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
