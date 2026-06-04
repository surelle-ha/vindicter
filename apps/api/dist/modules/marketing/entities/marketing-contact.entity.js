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
exports.MarketingContact = void 0;
const typeorm_1 = require("typeorm");
const marketing_segment_entity_1 = require("./marketing-segment.entity");
let MarketingContact = class MarketingContact {
};
exports.MarketingContact = MarketingContact;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MarketingContact.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], MarketingContact.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true, length: 120 }),
    __metadata("design:type", Object)
], MarketingContact.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true, length: 120 }),
    __metadata("design:type", Object)
], MarketingContact.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'subscribed' }),
    __metadata("design:type", String)
], MarketingContact.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_engaged_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], MarketingContact.prototype, "lastEngagedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => marketing_segment_entity_1.MarketingSegment, (segment) => segment.contacts, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'segment_id' }),
    __metadata("design:type", Object)
], MarketingContact.prototype, "segment", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'segment_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], MarketingContact.prototype, "segmentId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], MarketingContact.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], MarketingContact.prototype, "updatedAt", void 0);
exports.MarketingContact = MarketingContact = __decorate([
    (0, typeorm_1.Entity)('marketing_contacts')
], MarketingContact);
//# sourceMappingURL=marketing-contact.entity.js.map