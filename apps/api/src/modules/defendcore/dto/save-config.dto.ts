import { IsBoolean, IsOptional } from 'class-validator'
import { Transform } from 'class-transformer'

export class SaveConfigDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => Boolean(value))
  desktopEnabled?: boolean
}
