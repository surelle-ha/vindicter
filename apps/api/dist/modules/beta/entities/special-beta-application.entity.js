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
exports.SpecialBetaApplication = void 0;
const typeorm_1 = require("typeorm");
let SpecialBetaApplication = class SpecialBetaApplication {
};
exports.SpecialBetaApplication = SpecialBetaApplication;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SpecialBetaApplication.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'org_name', length: 255 }),
    __metadata("design:type", String)
], SpecialBetaApplication.prototype, "orgName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'org_size', length: 50 }),
    __metadata("design:type", String)
], SpecialBetaApplication.prototype, "orgSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], SpecialBetaApplication.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_name', length: 255 }),
    __metadata("design:type", String)
], SpecialBetaApplication.prototype, "contactName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_email', length: 255 }),
    __metadata("design:type", String)
], SpecialBetaApplication.prototype, "contactEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'partner_type', length: 50, default: 'organization' }),
    __metadata("design:type", String)
], SpecialBetaApplication.prototype, "partnerType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", Object)
], SpecialBetaApplication.prototype, "referral", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agreed_terms', default: false }),
    __metadata("design:type", Boolean)
], SpecialBetaApplication.prototype, "agreedTerms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'pending' }),
    __metadata("design:type", String)
], SpecialBetaApplication.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SpecialBetaApplication.prototype, "createdAt", void 0);
exports.SpecialBetaApplication = SpecialBetaApplication = __decorate([
    (0, typeorm_1.Entity)('special_beta_applications')
], SpecialBetaApplication);
//# sourceMappingURL=special-beta-application.entity.js.map