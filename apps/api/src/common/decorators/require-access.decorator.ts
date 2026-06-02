import { SetMetadata } from '@nestjs/common'

export const ACCESS_KEY = 'access'
export const RequireAccess = (resource: string, action: string) =>
  SetMetadata(ACCESS_KEY, { resource, action })
