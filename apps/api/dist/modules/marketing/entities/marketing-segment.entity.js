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
exports.MarketingSegment = void 0;
const typeorm_1 = require("typeorm");
const marketing_contact_entity_1 = require("./marketing-contact.entity");
let MarketingSegment = class MarketingSegment {
};
exports.MarketingSegment = MarketingSegment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MarketingSegment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], MarketingSegment.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120, default: 'Internal list' }),
    __metadata("design:type", String)
], MarketingSegment.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'draft' }),
    __metadata("design:type", String)
], MarketingSegment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_team', length: 80, default: 'Marketing' }),
    __metadata("design:type", String)
], MarketingSegment.prototype, "ownerTeam", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], MarketingSegment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], MarketingSegment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => marketing_contact_entity_1.MarketingContact, (contact) => contact.segment),
    __metadata("design:type", Array)
], MarketingSegment.prototype, "contacts", void 0);
exports.MarketingSegment = MarketingSegment = __decorate([
    (0, typeorm_1.Entity)('marketing_segments')
], MarketingSegment);
//# sourceMappingURL=marketing-segment.entity.js.map