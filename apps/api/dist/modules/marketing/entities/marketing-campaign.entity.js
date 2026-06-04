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
exports.MarketingCampaign = void 0;
const typeorm_1 = require("typeorm");
let MarketingCampaign = class MarketingCampaign {
};
exports.MarketingCampaign = MarketingCampaign;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MarketingCampaign.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], MarketingCampaign.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_kind', type: 'varchar', length: 40, default: 'internal_update' }),
    __metadata("design:type", String)
], MarketingCampaign.prototype, "campaignKind", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from_name', length: 120 }),
    __metadata("design:type", String)
], MarketingCampaign.prototype, "fromName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from_email', length: 255 }),
    __metadata("design:type", String)
], MarketingCampaign.prototype, "fromEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 180 }),
    __metadata("design:type", String)
], MarketingCampaign.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true, length: 220 }),
    __metadata("design:type", Object)
], MarketingCampaign.prototype, "preheader", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], MarketingCampaign.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cta_label', type: 'varchar', nullable: true, length: 80 }),
    __metadata("design:type", Object)
], MarketingCampaign.prototype, "ctaLabel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cta_url', nullable: true, type: 'text' }),
    __metadata("design:type", Object)
], MarketingCampaign.prototype, "ctaUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'segment_ids', type: 'jsonb', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], MarketingCampaign.prototype, "segmentIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'draft' }),
    __metadata("design:type", String)
], MarketingCampaign.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'scheduled_for', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], MarketingCampaign.prototype, "scheduledFor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sent_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], MarketingCampaign.prototype, "sentAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_error', nullable: true, type: 'text' }),
    __metadata("design:type", Object)
], MarketingCampaign.prototype, "lastError", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], MarketingCampaign.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], MarketingCampaign.prototype, "updatedAt", void 0);
exports.MarketingCampaign = MarketingCampaign = __decorate([
    (0, typeorm_1.Entity)('marketing_campaigns')
], MarketingCampaign);
//# sourceMappingURL=marketing-campaign.entity.js.map