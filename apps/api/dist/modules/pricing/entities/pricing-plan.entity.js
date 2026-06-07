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
exports.PricingPlan = void 0;
const typeorm_1 = require("typeorm");
let PricingPlan = class PricingPlan {
};
exports.PricingPlan = PricingPlan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PricingPlan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], PricingPlan.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", Object)
], PricingPlan.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'token_limit', default: 0 }),
    __metadata("design:type", Number)
], PricingPlan.prototype, "tokenLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'seat_limit', default: 1 }),
    __metadata("design:type", Number)
], PricingPlan.prototype, "seatLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_limit', default: 3 }),
    __metadata("design:type", Number)
], PricingPlan.prototype, "projectLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'price_usd', type: 'numeric', precision: 8, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PricingPlan.prototype, "priceUsd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], PricingPlan.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', default: 0 }),
    __metadata("design:type", Number)
], PricingPlan.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PricingPlan.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PricingPlan.prototype, "updatedAt", void 0);
exports.PricingPlan = PricingPlan = __decorate([
    (0, typeorm_1.Entity)('pricing_plans')
], PricingPlan);
//# sourceMappingURL=pricing-plan.entity.js.map