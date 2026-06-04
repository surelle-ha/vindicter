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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("./entities/role.entity");
const access_entity_1 = require("./entities/access.entity");
const role_access_entity_1 = require("./entities/role-access.entity");
const user_role_entity_1 = require("./entities/user-role.entity");
let RolesService = class RolesService {
    constructor(roleRepo, accessRepo, roleAccessRepo, userRoleRepo) {
        this.roleRepo = roleRepo;
        this.accessRepo = accessRepo;
        this.roleAccessRepo = roleAccessRepo;
        this.userRoleRepo = userRoleRepo;
    }
    findAllRoles() {
        return this.roleRepo.find({ order: { name: 'ASC' } });
    }
    async findOneRole(id) {
        const role = await this.roleRepo.findOne({
            where: { id },
            relations: ['roleAccesses', 'roleAccesses.access'],
        });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        return role;
    }
    async createRole(name, description) {
        const exists = await this.roleRepo.findOneBy({ name });
        if (exists)
            throw new common_1.ConflictException('Role name already exists');
        return this.roleRepo.save(this.roleRepo.create({ name, description }));
    }
    async deleteRole(id) {
        const role = await this.roleRepo.findOneBy({ id });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        await this.roleRepo.remove(role);
    }
    findAllAccesses() {
        return this.accessRepo.find({ order: { resource: 'ASC', action: 'ASC' } });
    }
    async createAccess(resource, action, description) {
        const exists = await this.accessRepo.findOneBy({ resource, action });
        if (exists)
            throw new common_1.ConflictException('Access already exists');
        return this.accessRepo.save(this.accessRepo.create({ resource, action, description }));
    }
    async deleteAccess(id) {
        const access = await this.accessRepo.findOneBy({ id });
        if (!access)
            throw new common_1.NotFoundException('Access not found');
        await this.accessRepo.remove(access);
    }
    async assignAccessToRole(roleId, accessId) {
        const [role, access] = await Promise.all([
            this.roleRepo.findOneBy({ id: roleId }),
            this.accessRepo.findOneBy({ id: accessId }),
        ]);
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        if (!access)
            throw new common_1.NotFoundException('Access not found');
        const exists = await this.roleAccessRepo.findOne({ where: { role: { id: roleId }, access: { id: accessId } } });
        if (exists)
            return exists;
        return this.roleAccessRepo.save(this.roleAccessRepo.create({ role, access }));
    }
    async removeAccessFromRole(roleId, accessId) {
        const ra = await this.roleAccessRepo.findOne({ where: { role: { id: roleId }, access: { id: accessId } } });
        if (ra)
            await this.roleAccessRepo.remove(ra);
    }
    async assignRoleToUser(userId, roleId) {
        const role = await this.roleRepo.findOneBy({ id: roleId });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        const exists = await this.userRoleRepo.findOne({ where: { user: { id: userId }, role: { id: roleId } } });
        if (exists)
            return exists;
        return this.userRoleRepo.save(this.userRoleRepo.create({ user: { id: userId }, role }));
    }
    async removeRoleFromUser(userId, roleId) {
        const ur = await this.userRoleRepo.findOne({ where: { user: { id: userId }, role: { id: roleId } } });
        if (ur)
            await this.userRoleRepo.remove(ur);
    }
    getUserRoles(userId) {
        return this.userRoleRepo.find({
            where: { user: { id: userId } },
            relations: ['role'],
        });
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(access_entity_1.Access)),
    __param(2, (0, typeorm_1.InjectRepository)(role_access_entity_1.RoleAccess)),
    __param(3, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RolesService);
//# sourceMappingURL=roles.service.js.map