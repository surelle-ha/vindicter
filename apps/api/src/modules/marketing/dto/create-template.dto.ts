import { IsIn, IsObject, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator'
import type { MarketingCampaignKind } from '../entities/marketing-campaign.entity'
import type { MarketingTemplateStatus } from '../entities/marketing-template.entity'

export class CreateTemplateDto {
  @IsString()
  @MaxLength(140)
  name: string

  @IsIn(['internal_update', 'release_note', 'operational_notice'])
  campaignKind: MarketingCampaignKind

  @IsString()
  @MaxLength(180)
  subject: string

  @IsOptional()
  @IsString()
  @MaxLength(220)
  preheader?: string

  @IsString()
  body: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ctaLabel?: string

  @IsOptional()
  @IsUrl({ require_protocol: true })
  ctaUrl?: string

  @IsOptional()
  @IsObject()
  variableMap?: Record<string, string>

  @IsOptional()
  @IsIn(['draft', 'active', 'archived'])
  status?: MarketingTemplateStatus
}
