import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { databaseConfig } from './config/database.config'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { RolesModule } from './modules/roles/roles.module'
import { NewsletterModule } from './modules/newsletter/newsletter.module'
import { BetaModule } from './modules/beta/beta.module'
import { SupportModule } from './modules/support/support.module'
import { ApiTokensModule } from './modules/api-tokens/api-tokens.module'
import { NewsModule } from './modules/news/news.module'
import { MarketingModule } from './modules/marketing/marketing.module'
import { AcademyModule } from './modules/academy/academy.module'
import { DefendCoreModule } from './modules/defendcore/defendcore.module'
import { CorsModule } from './modules/cors/cors.module'
import { PricingModule } from './modules/pricing/pricing.module'
import { WorkspacesModule } from './modules/workspaces/workspaces.module'
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: databaseConfig }),

    // Global rate limiting: 100 req / 60 s per IP by default
    // Per-route overrides via @Throttle() decorator
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60_000, limit: 100 },
    ]),

    AuthModule,
    UsersModule,
    RolesModule,
    NewsletterModule,
    BetaModule,
    SupportModule,
    ApiTokensModule,
    NewsModule,
    MarketingModule,
    AcademyModule,
    DefendCoreModule,
    CorsModule,
    PricingModule,
    WorkspacesModule,
    SubscriptionsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
