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
exports.NewsController = void 0;
const common_1 = require("@nestjs/common");
const news_service_1 = require("./news.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const require_roles_decorator_1 = require("../../common/decorators/require-roles.decorator");
let NewsController = class NewsController {
    constructor(newsService) {
        this.newsService = newsService;
    }
    getArticles(limit, category) {
        return this.newsService.findArticles(limit ? Number(limit) : 60, category);
    }
    getFeeds() {
        return this.newsService.findAllFeeds();
    }
    createFeed(body) {
        return this.newsService.createFeed(body.name, body.url, body.category);
    }
    updateFeed(id, body) {
        return this.newsService.updateFeed(id, body);
    }
    deleteFeed(id) {
        return this.newsService.deleteFeed(id);
    }
};
exports.NewsController = NewsController;
__decorate([
    (0, common_1.Get)('articles'),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "getArticles", null);
__decorate([
    (0, common_1.Get)('feeds'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "getFeeds", null);
__decorate([
    (0, common_1.Post)('feeds'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, require_roles_decorator_1.RequireRoles)('admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "createFeed", null);
__decorate([
    (0, common_1.Patch)('feeds/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, require_roles_decorator_1.RequireRoles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "updateFeed", null);
__decorate([
    (0, common_1.Delete)('feeds/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, require_roles_decorator_1.RequireRoles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NewsController.prototype, "deleteFeed", null);
exports.NewsController = NewsController = __decorate([
    (0, common_1.Controller)('news'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [news_service_1.NewsService])
], NewsController);
//# sourceMappingURL=news.controller.js.map