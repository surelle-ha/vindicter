import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MarketingCampaign } from './entities/marketing-campaign.entity'
import { MarketingContact } from './entities/marketing-contact.entity'
import { MarketingSegment } from './entities/marketing-segment.entity'
import { MarketingSendEvent } from './entities/marketing-send-event.entity'
import { MarketingTemplate } from './entities/marketing-template.entity'
import { MarketingController } from './marketing.controller'
import { MarketingService } from './marketing.service'
import { SmtpService } from './smtp.service'

@Module({
  imports: [TypeOrmModule.forFeature([MarketingSegment, MarketingContact, MarketingCampaign, MarketingTemplate, MarketingSendEvent])],
  controllers: [MarketingController],
  providers: [MarketingService, SmtpService],
})
export class MarketingModule {}
