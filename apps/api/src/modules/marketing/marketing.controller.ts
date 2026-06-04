import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { AccessGuard } from '../../common/guards/access.guard'
import { RequireAccess } from '../../common/decorators/require-access.decorator'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { CreateContactDto } from './dto/create-contact.dto'
import { CreateSegmentDto } from './dto/create-segment.dto'
import { CreateTemplateDto } from './dto/create-template.dto'
import { SendCampaignDto } from './dto/send-campaign.dto'
import { MarketingService } from './marketing.service'
import type { MarketingCampaignKind } from './entities/marketing-campaign.entity'

@Controller('marketing')
@UseGuards(JwtAuthGuard, AccessGuard)
export class MarketingController {
  constructor(private readonly service: MarketingService) {}

  @Get('summary')
  @RequireAccess('marketing', 'read')
  summary() {
    return this.service.summary()
  }

  @Get('segments')
  @RequireAccess('marketing', 'read')
  findSegments() {
    return this.service.findSegments()
  }

  @Post('segments')
  @RequireAccess('marketing', 'create')
  createSegment(@Body() dto: CreateSegmentDto) {
    return this.service.createSegment(dto)
  }

  @Patch('segments/:id')
  @RequireAccess('marketing', 'update')
  updateSegment(@Param('id') id: string, @Body() dto: Partial<CreateSegmentDto>) {
    return this.service.updateSegment(id, dto)
  }

  @Delete('segments/:id')
  @RequireAccess('marketing', 'delete')
  removeSegment(@Param('id') id: string) {
    return this.service.removeSegment(id)
  }

  @Get('contacts')
  @RequireAccess('marketing', 'read')
  findContacts() {
    return this.service.findContacts()
  }

  @Get('templates')
  @RequireAccess('marketing', 'read')
  findTemplates(@Query('kind') kind?: MarketingCampaignKind) {
    return this.service.findTemplates(kind)
  }

  @Post('templates')
  @RequireAccess('marketing', 'create')
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.service.createTemplate(dto)
  }

  @Patch('templates/:id')
  @RequireAccess('marketing', 'update')
  updateTemplate(@Param('id') id: string, @Body() dto: Partial<CreateTemplateDto>) {
    return this.service.updateTemplate(id, dto)
  }

  @Delete('templates/:id')
  @RequireAccess('marketing', 'delete')
  removeTemplate(@Param('id') id: string) {
    return this.service.removeTemplate(id)
  }

  @Post('contacts')
  @RequireAccess('marketing', 'create')
  createContact(@Body() dto: CreateContactDto) {
    return this.service.createContact(dto)
  }

  @Patch('contacts/:id')
  @RequireAccess('marketing', 'update')
  updateContact(@Param('id') id: string, @Body() dto: Partial<CreateContactDto>) {
    return this.service.updateContact(id, dto)
  }

  @Delete('contacts/:id')
  @RequireAccess('marketing', 'delete')
  removeContact(@Param('id') id: string) {
    return this.service.removeContact(id)
  }

  @Get('campaigns')
  @RequireAccess('marketing', 'read')
  findCampaigns() {
    return this.service.findCampaigns()
  }

  @Get('history')
  @RequireAccess('marketing', 'read')
  findSendHistory() {
    return this.service.findSendHistory()
  }

  @Post('campaigns')
  @RequireAccess('marketing', 'create')
  createCampaign(@Body() dto: CreateCampaignDto) {
    return this.service.createCampaign(dto)
  }

  @Patch('campaigns/:id')
  @RequireAccess('marketing', 'update')
  updateCampaign(@Param('id') id: string, @Body() dto: Partial<CreateCampaignDto>) {
    return this.service.updateCampaign(id, dto)
  }

  @Post('campaigns/:id/send')
  @RequireAccess('marketing', 'send')
  sendCampaign(@Param('id') id: string, @Body() dto: SendCampaignDto) {
    return this.service.sendCampaign(id, dto)
  }
}
