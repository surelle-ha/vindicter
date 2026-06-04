import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { User } from '../modules/users/entities/user.entity'
import { Role } from '../modules/roles/entities/role.entity'
import { Access } from '../modules/roles/entities/access.entity'
import { RoleAccess } from '../modules/roles/entities/role-access.entity'
import { UserRole } from '../modules/roles/entities/user-role.entity'
import { NewsletterSignup } from '../modules/newsletter/entities/newsletter-signup.entity'
import { NewsletterUpdate } from '../modules/newsletter/entities/newsletter-update.entity'
import { SpecialBetaApplication } from '../modules/beta/entities/special-beta-application.entity'
import { SupportTicket } from '../modules/support/entities/support-ticket.entity'
import { ApiToken } from '../modules/api-tokens/entities/api-token.entity'
import { MarketingSegment } from '../modules/marketing/entities/marketing-segment.entity'
import { MarketingContact } from '../modules/marketing/entities/marketing-contact.entity'
import { MarketingCampaign } from '../modules/marketing/entities/marketing-campaign.entity'
import { MarketingTemplate } from '../modules/marketing/entities/marketing-template.entity'
import { MarketingSendEvent } from '../modules/marketing/entities/marketing-send-event.entity'

export const databaseConfig = (): TypeOrmModuleOptions => {
  const url = process.env.DATABASE_URL ?? ''
  if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
    throw new Error(
      'DATABASE_URL must be a PostgreSQL connection string (postgres:// or postgresql://). ' +
      'Only PostgreSQL is supported.',
    )
  }

  return {
    type: 'postgres',
    url,
    entities: [
      User, Role, Access, RoleAccess, UserRole,
      NewsletterSignup, NewsletterUpdate,
      SpecialBetaApplication, SupportTicket, ApiToken,
      MarketingSegment, MarketingContact, MarketingCampaign,
      MarketingTemplate, MarketingSendEvent,
    ],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  }
}
