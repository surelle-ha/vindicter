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
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
