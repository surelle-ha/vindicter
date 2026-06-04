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
exports.MarketingTemplate = void 0;
const typeorm_1 = require("typeorm");
let MarketingTemplate = class MarketingTemplate {
};
exports.MarketingTemplate = MarketingTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MarketingTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 140 }),
    __metadata("design:type", String)
], MarketingTemplate.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_kind', type: 'varchar', length: 40 }),
    __metadata("design:type", String)
], MarketingTemplate.prototype, "campaignKind", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 180 }),
    __metadata("design:type", String)
], MarketingTemplate.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true, length: 220 }),
    __metadata("design:type", Object)
], MarketingTemplate.prototype, "preheader", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], MarketingTemplate.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cta_label', type: 'varchar', nullable: true, length: 80 }),
    __metadata("design:type", Object)
], MarketingTemplate.prototype, "ctaLabel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cta_url', nullable: true, type: 'text' }),
    __metadata("design:type", Object)
], MarketingTemplate.prototype, "ctaUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'variable_map', type: 'jsonb', default: () => "'{}'::jsonb" }),
    __metadata("design:type", Object)
], MarketingTemplate.prototype, "variableMap", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'active' }),
    __metadata("design:type", String)
], MarketingTemplate.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], MarketingTemplate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], MarketingTemplate.prototype, "updatedAt", void 0);
exports.MarketingTemplate = MarketingTemplate = __decorate([
    (0, typeorm_1.Entity)('marketing_templates')
], MarketingTemplate);
//# sourceMappingURL=marketing-template.entity.js.map