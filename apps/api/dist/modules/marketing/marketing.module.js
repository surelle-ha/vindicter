"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const marketing_campaign_entity_1 = require("./entities/marketing-campaign.entity");
const marketing_contact_entity_1 = require("./entities/marketing-contact.entity");
const marketing_segment_entity_1 = require("./entities/marketing-segment.entity");
const marketing_send_event_entity_1 = require("./entities/marketing-send-event.entity");
const marketing_template_entity_1 = require("./entities/marketing-template.entity");
const marketing_controller_1 = require("./marketing.controller");
const marketing_service_1 = require("./marketing.service");
const smtp_service_1 = require("./smtp.service");
let MarketingModule = class MarketingModule {
};
exports.MarketingModule = MarketingModule;
exports.MarketingModule = MarketingModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([marketing_segment_entity_1.MarketingSegment, marketing_contact_entity_1.MarketingContact, marketing_campaign_entity_1.MarketingCampaign, marketing_template_entity_1.MarketingTemplate, marketing_send_event_entity_1.MarketingSendEvent])],
        controllers: [marketing_controller_1.MarketingController],
        providers: [marketing_service_1.MarketingService, smtp_service_1.SmtpService],
    })
], MarketingModule);
//# sourceMappingURL=marketing.module.js.map