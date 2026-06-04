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
exports.RssFeed = void 0;
const typeorm_1 = require("typeorm");
const rss_article_entity_1 = require("./rss-article.entity");
let RssFeed = class RssFeed {
};
exports.RssFeed = RssFeed;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RssFeed.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RssFeed.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], RssFeed.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'general' }),
    __metadata("design:type", String)
], RssFeed.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], RssFeed.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => rss_article_entity_1.RssArticle, article => article.feed),
    __metadata("design:type", Array)
], RssFeed.prototype, "articles", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], RssFeed.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], RssFeed.prototype, "updatedAt", void 0);
exports.RssFeed = RssFeed = __decorate([
    (0, typeorm_1.Entity)('rss_feeds')
], RssFeed);
//# sourceMappingURL=rss-feed.entity.js.map