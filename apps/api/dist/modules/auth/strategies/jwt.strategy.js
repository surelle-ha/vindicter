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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const typeorm_1 = require("@nestjs/typeorm");
const passport_jwt_1 = require("passport-jwt");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const user_role_entity_1 = require("../../roles/entities/user-role.entity");
const workspace_member_entity_1 = require("../../workspaces/entities/workspace-member.entity");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(userRepo, userRoleRepo, memberRepo) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET ?? 'fallback-secret',
        });
        this.userRepo = userRepo;
        this.userRoleRepo = userRoleRepo;
        this.memberRepo = memberRepo;
    }
    async validate(payload) {
        const user = await this.userRepo.findOne({ where: { id: payload.sub, isActive: true } });
        if (!user)
            throw new common_1.UnauthorizedException();
        const userRoles = await this.userRoleRepo.find({
            where: { user: { id: user.id } },
            relations: ['role', 'role.roleAccesses', 'role.roleAccesses.access'],
        });
        const roles = [];
        const accesses = [];
        for (const ur of userRoles) {
            roles.push(ur.role.name);
            for (const ra of ur.role.roleAccesses ?? []) {
                accesses.push(`${ra.access.resource}.${ra.access.action}`);
            }
        }
        let workspaces = [];
        try {
            const memberships = await this.memberRepo.find({
                where: { user: { id: user.id } },
                relations: ['workspace'],
            });
            workspaces = memberships.map(m => ({
                id: m.workspace.id,
                name: m.workspace.name,
                memberRole: m.memberRole,
            }));
        }
        catch {
        }
        return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, roles, accesses, workspaces };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __param(2, (0, typeorm_1.InjectRepository)(workspace_member_entity_1.WorkspaceMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map