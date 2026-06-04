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
exports.NewsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rss_feed_entity_1 = require("./entities/rss-feed.entity");
const rss_article_entity_1 = require("./entities/rss-article.entity");
let NewsService = class NewsService {
    constructor(feedRepo, articleRepo) {
        this.feedRepo = feedRepo;
        this.articleRepo = articleRepo;
    }
    findAllFeeds() {
        return this.feedRepo.find({ order: { createdAt: 'ASC' } });
    }
    async createFeed(name, url, category = 'general') {
        return this.feedRepo.save(this.feedRepo.create({ name, url, category }));
    }
    async updateFeed(id, partial) {
        const feed = await this.feedRepo.findOneBy({ id });
        if (!feed)
            throw new common_1.NotFoundException('Feed not found');
        Object.assign(feed, partial);
        return this.feedRepo.save(feed);
    }
    async deleteFeed(id) {
        const feed = await this.feedRepo.findOneBy({ id });
        if (!feed)
            throw new common_1.NotFoundException('Feed not found');
        await this.feedRepo.remove(feed);
    }
    findArticles(limit = 60, category) {
        const qb = this.articleRepo.createQueryBuilder('a')
            .orderBy('a.publishedAt', 'DESC')
            .limit(limit);
        if (category && category !== 'all') {
            qb.innerJoin('a.feed', 'f').where('f.category = :category', { category });
        }
        return qb.getMany();
    }
    async upsertArticle(dto) {
        await this.articleRepo.upsert({ ...dto, fetchedAt: new Date() }, { conflictPaths: ['link'], skipUpdateIfNoValuesChanged: true });
    }
};
exports.NewsService = NewsService;
exports.NewsService = NewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(rss_feed_entity_1.RssFeed)),
    __param(1, (0, typeorm_1.InjectRepository)(rss_article_entity_1.RssArticle)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], NewsService);
//# sourceMappingURL=news.service.js.map