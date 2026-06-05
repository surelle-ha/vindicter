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
exports.NewsletterController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const newsletter_service_1 = require("./newsletter.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const access_guard_1 = require("../../common/guards/access.guard");
const require_access_decorator_1 = require("../../common/decorators/require-access.decorator");
const class_validator_1 = require("class-validator");
class SignupDto {
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SignupDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignupDto.prototype, "accountType", void 0);
let NewsletterController = class NewsletterController {
    constructor(service) {
        this.service = service;
    }
    upsertSignup(dto) {
        return this.service.upsertSignup(dto.email, dto.accountType);
    }
    findByToken(token) {
        return this.service.findSignupByToken(token);
    }
    async downloadByToken(token, res) {
        const url = await this.service.getDownloadUrlForToken(token);
        const safeUrl = encodeURI(url);
        res.type('text/html; charset=utf-8').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Downloading Vindicter…</title>
  <script>window.location.href=${JSON.stringify(safeUrl)}</script>
</head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#0f1012;color:#e4e4e7;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;">
  <div>
    <p style="font-size:18px;font-weight:700;margin:0 0 12px;">Your download is starting…</p>
    <p style="font-size:13px;color:#9ca3af;margin:0;">
      If it doesn't begin automatically,
      <a href="${safeUrl}" style="color:#6366f1;text-decoration:underline;">click here</a>.
    </p>
  </div>
</body>
</html>`);
    }
    getPublished(limit) {
        return this.service.findPublishedUpdates(limit ? Number(limit) : undefined);
    }
    findAllSignups() { return this.service.findAllSignups(); }
    findAllUpdates() { return this.service.findAllUpdates(); }
    createUpdate(body) { return this.service.createUpdate(body); }
    updateOne(id, body) {
        return this.service.updateOne(id, body);
    }
    removeUpdate(id) { return this.service.removeUpdate(id); }
};
exports.NewsletterController = NewsletterController;
__decorate([
    (0, throttler_1.Throttle)({ global: { ttl: 60_000, limit: 5 } }),
    (0, common_1.Post)('signups'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SignupDto]),
    __metadata("design:returntype", void 0)
], NewsletterController.prototype, "upsertSignup", null);
__decorate([
    (0, common_1.Get)('signups/token/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NewsletterController.prototype, "findByToken", null);
__decorate([
    (0, common_1.Get)('signups/download/:token'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NewsletterController.prototype, "downloadByToken", null);
__decorate([
    (0, common_1.Get)('updates/published'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NewsletterController.prototype, "getPublished", null);
__decorate([
    (0, common_1.Get)('signups'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, access_guard_1.AccessGuard),
    (0, require_access_decorator_1.RequireAccess)('newsletter', 'read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NewsletterController.prototype, "findAllSignups", null);
__decorate([
    (0, common_1.Get)('updates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, access_guard_1.AccessGuard),
    (0, require_access_decorator_1.RequireAccess)('newsletter', 'read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NewsletterController.prototype, "findAllUpdates", null);
__decorate([
    (0, common_1.Post)('updates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, access_guard_1.AccessGuard),
    (0, require_access_decorator_1.RequireAccess)('newsletter', 'create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NewsletterController.prototype, "createUpdate", null);
__decorate([
    (0, common_1.Put)('updates/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, access_guard_1.AccessGuard),
    (0, require_access_decorator_1.RequireAccess)('newsletter', 'update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NewsletterController.prototype, "updateOne", null);
__decorate([
    (0, common_1.Delete)('updates/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, access_guard_1.AccessGuard),
    (0, require_access_decorator_1.RequireAccess)('newsletter', 'delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NewsletterController.prototype, "removeUpdate", null);
exports.NewsletterController = NewsletterController = __decorate([
    (0, common_1.Controller)('newsletter'),
    __metadata("design:paramtypes", [newsletter_service_1.NewsletterService])
], NewsletterController);
//# sourceMappingURL=newsletter.controller.js.map