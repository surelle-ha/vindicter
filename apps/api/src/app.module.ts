import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
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
    AuthModule,
    UsersModule,
    RolesModule,
    NewsletterModule,
    BetaModule,
    SupportModule,
    ApiTokensModule,
  ],
})
export class AppModule {}
