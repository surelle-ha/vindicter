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
exports.BetaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const special_beta_application_entity_1 = require("./entities/special-beta-application.entity");
let BetaService = class BetaService {
    constructor(repo) {
        this.repo = repo;
    }
    create(data) {
        return this.repo.save(this.repo.create({ ...data, status: 'pending' }));
    }
    findAll() {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    async updateStatus(id, status) {
        const app = await this.repo.findOneBy({ id });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        app.status = status;
        return this.repo.save(app);
    }
    async remove(id) {
        const app = await this.repo.findOneBy({ id });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        await this.repo.remove(app);
    }
};
exports.BetaService = BetaService;
exports.BetaService = BetaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(special_beta_application_entity_1.SpecialBetaApplication)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BetaService);
//# sourceMappingURL=beta.service.js.map