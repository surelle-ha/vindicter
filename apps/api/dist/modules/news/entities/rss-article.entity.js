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
exports.RssArticle = void 0;
const typeorm_1 = require("typeorm");
const rss_feed_entity_1 = require("./rss-feed.entity");
let RssArticle = class RssArticle {
};
exports.RssArticle = RssArticle;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RssArticle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => rss_feed_entity_1.RssFeed, feed => feed.articles, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'feed_id' }),
    __metadata("design:type", rss_feed_entity_1.RssFeed)
], RssArticle.prototype, "feed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'feed_id' }),
    __metadata("design:type", String)
], RssArticle.prototype, "feedId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'feed_name' }),
    __metadata("design:type", String)
], RssArticle.prototype, "feedName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RssArticle.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], RssArticle.prototype, "link", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", Object)
], RssArticle.prototype, "summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'published_at', nullable: true, type: 'timestamptz' }),
    __metadata("design:type", Object)
], RssArticle.prototype, "publishedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fetched_at' }),
    __metadata("design:type", Date)
], RssArticle.prototype, "fetchedAt", void 0);
exports.RssArticle = RssArticle = __decorate([
    (0, typeorm_1.Entity)('rss_articles')
], RssArticle);
//# sourceMappingURL=rss-article.entity.js.map