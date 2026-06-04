import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'
import type { MarketingContactStatus } from '../entities/marketing-contact.entity'

export class CreateContactDto {
  @IsEmail()
  email: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string

  @IsOptional()
  @IsUUID()
  segmentId?: string

  @IsOptional()
  @IsIn(['subscribed', 'bounced', 'unsubscribed'])
  status?: MarketingContactStatus
}
