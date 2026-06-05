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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("../users/entities/user.entity");
const user_role_entity_1 = require("../roles/entities/user-role.entity");
const role_entity_1 = require("../roles/entities/role.entity");
const TURNSTILE_DUMMY_PASS_SECRET = '1x0000000000000000000000000000000AA';
const TURNSTILE_DUMMY_PASS_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';
let AuthService = class AuthService {
    constructor(userRepo, userRoleRepo, roleRepo, jwt) {
        this.userRepo = userRepo;
        this.userRoleRepo = userRoleRepo;
        this.roleRepo = roleRepo;
        this.jwt = jwt;
    }
    async login(dto) {
        await this.verifyTurnstile(dto);
        const user = await this.userRepo.findOneBy({ email: dto.email.toLowerCase(), isActive: true });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const ok = await bcrypt.compare(dto.password, user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid credentials');
        return { access_token: this.jwt.sign({ sub: user.id, email: user.email }) };
    }
    async verifyTurnstile(dto) {
        const secret = process.env.TURNSTILE_SECRET_KEY;
        if (!secret)
            return;
        const protectedClients = (process.env.TURNSTILE_PROTECTED_CLIENTS ?? 'web-marketing')
            .split(',')
            .map((client) => client.trim())
            .filter(Boolean);
        const shouldVerify = (process.env.TURNSTILE_REQUIRED === 'true' ||
            (dto.clientApp ? protectedClients.includes(dto.clientApp) : false));
        if (!shouldVerify)
            return;
        if (!dto.turnstileToken) {
            throw new common_1.BadRequestException('Turnstile verification is required.');
        }
        if (secret === TURNSTILE_DUMMY_PASS_SECRET && dto.turnstileToken === TURNSTILE_DUMMY_PASS_TOKEN) {
            return;
        }
        const body = new URLSearchParams({
            secret,
            response: dto.turnstileToken,
        });
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
            throw new common_1.BadRequestException('Turnstile verification failed.');
        }
    }
    async register(dto) {
        const exists = await this.userRepo.findOneBy({ email: dto.email.toLowerCase() });
        if (exists)
            throw new common_1.ConflictException('Email already registered');
        const hash = await bcrypt.hash(dto.password, 12);
        const user = this.userRepo.create({
            email: dto.email.toLowerCase(),
            displayName: dto.displayName ?? null,
            passwordHash: hash,
        });
        await this.userRepo.save(user);
        const memberRole = await this.roleRepo.findOneBy({ name: 'member' });
        if (memberRole) {
            await this.userRoleRepo.save(this.userRoleRepo.create({ user, role: memberRole }));
        }
        return { access_token: this.jwt.sign({ sub: user.id, email: user.email }) };
    }
    async me(userId) {
        return this.userRepo.findOne({
            where: { id: userId },
            select: ['id', 'email', 'displayName', 'jobRole', 'experienceLevel', 'onboardingComplete', 'createdAt'],
        });
    }
    async updateProfile(userId, dto) {
        const patch = {};
        if (dto.displayName !== undefined)
            patch.displayName = dto.displayName;
        if (dto.jobRole !== undefined)
            patch.jobRole = dto.jobRole;
        if (dto.experienceLevel !== undefined)
            patch.experienceLevel = dto.experienceLevel;
        if (dto.onboardingComplete !== undefined)
            patch.onboardingComplete = dto.onboardingComplete;
        if (Object.keys(patch).length)
            await this.userRepo.update(userId, patch);
        return this.me(userId);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __param(2, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map