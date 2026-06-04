import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import type { MarketingSegmentStatus } from '../entities/marketing-segment.entity'

export class CreateSegmentDto {
  @IsString()
  @MaxLength(120)
  name: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ownerTeam?: string

  @IsOptional()
  @IsIn(['active', 'draft', 'paused'])
  status?: MarketingSegmentStatus
}
