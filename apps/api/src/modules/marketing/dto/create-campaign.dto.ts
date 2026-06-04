import { IsArray, IsEmail, IsIn, IsISO8601, IsOptional, IsString, IsUrl, IsUUID, MaxLength } from 'class-validator'
import type { MarketingCampaignKind } from '../entities/marketing-campaign.entity'

export class CreateCampaignDto {
  @IsString()
  @MaxLength(160)
  title: string

  @IsOptional()
  @IsIn(['internal_update', 'release_note', 'operational_notice'])
  campaignKind?: MarketingCampaignKind

  @IsString()
  @MaxLength(120)
  fromName: string

  @IsEmail()
  fromEmail: string

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

  @IsArray()
  @IsUUID('4', { each: true })
  segmentIds: string[]

  @IsOptional()
  @IsISO8601()
  scheduledFor?: string
}
