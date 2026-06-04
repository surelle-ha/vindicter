import { IsBoolean, IsEmail, IsOptional } from 'class-validator'

export class SendCampaignDto {
  @IsOptional()
  @IsBoolean()
  testOnly?: boolean

  @IsOptional()
  @IsEmail()
  testEmail?: string
}
