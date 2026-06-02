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

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User, Role, Access, RoleAccess, UserRole,
    NewsletterSignup, NewsletterUpdate,
    SpecialBetaApplication, SupportTicket, ApiToken,
  ],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
})
