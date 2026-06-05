import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NewsletterSignup } from './entities/newsletter-signup.entity'
import { NewsletterUpdate } from './entities/newsletter-update.entity'
import { NewsletterController } from './newsletter.controller'
import { NewsletterService } from './newsletter.service'
import { SmtpService } from '../marketing/smtp.service'

@Module({
  imports: [TypeOrmModule.forFeature([NewsletterSignup, NewsletterUpdate])],
  controllers: [NewsletterController],
  providers: [NewsletterService, SmtpService],
})
export class NewsletterModule {}
