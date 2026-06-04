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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const access_guard_1 = require("../../common/guards/access.guard");
const require_access_decorator_1 = require("../../common/decorators/require-access.decorator");
const create_campaign_dto_1 = require("./dto/create-campaign.dto");
const create_contact_dto_1 = require("./dto/create-contact.dto");
const create_segment_dto_1 = require("./dto/create-segment.dto");
const create_template_dto_1 = require("./dto/create-template.dto");
const send_campaign_dto_1 = require("./dto/send-campaign.dto");
const marketing_service_1 = require("./marketing.service");
let MarketingController = class MarketingController {
    constructor(service) {
        this.service = service;
    }
    summary() {
        return this.service.summary();
    }
    findSegments() {
        return this.service.findSegments();
    }
    createSegment(dto) {
        return this.service.createSegment(dto);
    }
    updateSegment(id, dto) {
        return this.service.updateSegment(id, dto);
    }
    removeSegment(id) {
        return this.service.removeSegment(id);
    }
    findContacts() {
        return this.service.findContacts();
    }
    findTemplates(kind) {
        return this.service.findTemplates(kind);
    }
    createTemplate(dto) {
        return this.service.createTemplate(dto);
    }
    updateTemplate(id, dto) {
        return this.service.updateTemplate(id, dto);
    }
    removeTemplate(id) {
        return this.service.removeTemplate(id);
    }
    createContact(dto) {
        return this.service.createContact(dto);
    }
    updateContact(id, dto) {
        return this.service.updateContact(id, dto);
    }
    removeContact(id) {
        return this.service.removeContact(id);
    }
    findCampaigns() {
        return this.service.findCampaigns();
    }
    findSendHistory() {
        return this.service.findSendHistory();
    }
    createCampaign(dto) {
        return this.service.createCampaign(dto);
    }
    updateCampaign(id, dto) {
        return this.service.updateCampaign(id, dto);
    }
    sendCampaign(id, dto) {
        return this.service.sendCampaign(id, dto);
    }
};
exports.MarketingController = MarketingController;
__decorate([
    (0, common_1.Get)('summary'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)('segments'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "findSegments", null);
__decorate([
    (0, common_1.Post)('segments'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_segment_dto_1.CreateSegmentDto]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "createSegment", null);
__decorate([
    (0, common_1.Patch)('segments/:id'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "updateSegment", null);
__decorate([
    (0, common_1.Delete)('segments/:id'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "removeSegment", null);
__decorate([
    (0, common_1.Get)('contacts'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "findContacts", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'read'),
    __param(0, (0, common_1.Query)('kind')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "findTemplates", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_template_dto_1.CreateTemplateDto]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Patch)('templates/:id'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "removeTemplate", null);
__decorate([
    (0, common_1.Post)('contacts'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_contact_dto_1.CreateContactDto]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "createContact", null);
__decorate([
    (0, common_1.Patch)('contacts/:id'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "updateContact", null);
__decorate([
    (0, common_1.Delete)('contacts/:id'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "removeContact", null);
__decorate([
    (0, common_1.Get)('campaigns'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "findCampaigns", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "findSendHistory", null);
__decorate([
    (0, common_1.Post)('campaigns'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_campaign_dto_1.CreateCampaignDto]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "createCampaign", null);
__decorate([
    (0, common_1.Patch)('campaigns/:id'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "updateCampaign", null);
__decorate([
    (0, common_1.Post)('campaigns/:id/send'),
    (0, require_access_decorator_1.RequireAccess)('marketing', 'send'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_campaign_dto_1.SendCampaignDto]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "sendCampaign", null);
exports.MarketingController = MarketingController = __decorate([
    (0, common_1.Controller)('marketing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, access_guard_1.AccessGuard),
    __metadata("design:paramtypes", [marketing_service_1.MarketingService])
], MarketingController);
//# sourceMappingURL=marketing.controller.js.map