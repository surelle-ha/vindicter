"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingSendEvent = void 0;
const typeorm_1 = require("typeorm");
const marketing_campaign_entity_1 = require("./marketing-campaign.entity");
let MarketingSendEvent = class MarketingSendEvent {
};
exports.MarketingSendEvent = MarketingSendEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MarketingSendEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => marketing_campaign_entity_1.MarketingCampaign, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'campaign_id' }),
    __metadata("design:type", Object)
], MarketingSendEvent.prototype, "campaign", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], MarketingSendEvent.prototype, "campaignId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_title', length: 160 }),
    __metadata("design:type", String)
], MarketingSendEvent.prototype, "campaignTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_kind', type: 'varchar', length: 40 }),
    __metadata("design:type", String)
], MarketingSendEvent.prototype, "campaignKind", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recipients_count', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], MarketingSendEvent.prototype, "recipientsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'test_only', default: false }),
    __metadata("design:type", Boolean)
], MarketingSendEvent.prototype, "testOnly", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'test_email', type: 'varchar', nullable: true, length: 255 }),
    __metadata("design:type", Object)
], MarketingSendEvent.prototype, "testEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'message_id', type: 'varchar', nullable: true, length: 255 }),
    __metadata("design:type", Object)
], MarketingSendEvent.prototype, "messageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], MarketingSendEvent.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", Object)
], MarketingSendEvent.prototype, "error", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sent_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], MarketingSendEvent.prototype, "sentAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], MarketingSendEvent.prototype, "createdAt", void 0);
exports.MarketingSendEvent = MarketingSendEvent = __decorate([
    (0, typeorm_1.Entity)('marketing_send_events')
], MarketingSendEvent);
//# sourceMappingURL=marketing-send-event.entity.js.map