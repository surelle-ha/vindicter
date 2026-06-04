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
exports.NewsletterService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const nanoid_1 = require("nanoid");
const newsletter_signup_entity_1 = require("./entities/newsletter-signup.entity");
const newsletter_update_entity_1 = require("./entities/newsletter-update.entity");
let NewsletterService = class NewsletterService {
    constructor(signupRepo, updateRepo) {
        this.signupRepo = signupRepo;
        this.updateRepo = updateRepo;
    }
    async upsertSignup(email, accountType = 'individual') {
        const existing = await this.signupRepo.findOneBy({ email: email.toLowerCase() });
        const token = (0, nanoid_1.nanoid)(32);
        if (existing) {
            existing.downloadToken = token;
            await this.signupRepo.save(existing);
            return { email: existing.email, downloadToken: token };
        }
        const signup = this.signupRepo.create({ email: email.toLowerCase(), downloadToken: token, accountType });
        await this.signupRepo.save(signup);
        return { email: signup.email, downloadToken: token };
    }
    async findSignupByToken(token) {
        const signup = await this.signupRepo.findOneBy({ downloadToken: token });
        if (!signup)
            throw new common_1.NotFoundException('Token not found');
        return { email: signup.email, downloadToken: signup.downloadToken };
    }
    findAllSignups() {
        return this.signupRepo.find({ order: { createdAt: 'DESC' } });
    }
    findPublishedUpdates(limit) {
        const query = this.updateRepo
            .createQueryBuilder('u')
            .where('u.status = :status', { status: 'published' })
            .orderBy('u.published_at', 'DESC');
        if (limit)
            query.take(limit);
        return query.getMany();
    }
    findAllUpdates() {
        return this.updateRepo.find({ order: { createdAt: 'DESC' } });
    }
    async createUpdate(data) {
        const update = this.updateRepo.create(data);
        return this.updateRepo.save(update);
    }
    async updateOne(id, data) {
        const update = await this.updateRepo.findOneBy({ id });
        if (!update)
            throw new common_1.NotFoundException('Update not found');
        Object.assign(update, data);
        if (data.status === 'published' && !update.publishedAt) {
            update.publishedAt = new Date();
        }
        return this.updateRepo.save(update);
    }
    async removeUpdate(id) {
        const update = await this.updateRepo.findOneBy({ id });
        if (!update)
            throw new common_1.NotFoundException('Update not found');
        await this.updateRepo.remove(update);
    }
};
exports.NewsletterService = NewsletterService;
exports.NewsletterService = NewsletterService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(newsletter_signup_entity_1.NewsletterSignup)),
    __param(1, (0, typeorm_1.InjectRepository)(newsletter_update_entity_1.NewsletterUpdate)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], NewsletterService);
//# sourceMappingURL=newsletter.service.js.map