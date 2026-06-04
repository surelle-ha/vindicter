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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const roles_service_1 = require("./roles.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const access_guard_1 = require("../../common/guards/access.guard");
const require_access_decorator_1 = require("../../common/decorators/require-access.decorator");
let RolesController = class RolesController {
    constructor(service) {
        this.service = service;
    }
    findAllRoles() { return this.service.findAllRoles(); }
    findOneRole(id) { return this.service.findOneRole(id); }
    createRole(body) {
        return this.service.createRole(body.name, body.description);
    }
    deleteRole(id) { return this.service.deleteRole(id); }
    findAllAccesses() { return this.service.findAllAccesses(); }
    createAccess(body) {
        return this.service.createAccess(body.resource, body.action, body.description);
    }
    deleteAccess(id) { return this.service.deleteAccess(id); }
    assignAccess(roleId, accessId) {
        return this.service.assignAccessToRole(roleId, accessId);
    }
    removeAccess(roleId, accessId) {
        return this.service.removeAccessFromRole(roleId, accessId);
    }
    getUserRoles(userId) {
        return this.service.getUserRoles(userId);
    }
    assignRole(userId, roleId) {
        return this.service.assignRoleToUser(userId, roleId);
    }
    removeRole(userId, roleId) {
        return this.service.removeRoleFromUser(userId, roleId);
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Get)('roles'),
    (0, require_access_decorator_1.RequireAccess)('roles', 'read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findAllRoles", null);
__decorate([
    (0, common_1.Get)('roles/:id'),
    (0, require_access_decorator_1.RequireAccess)('roles', 'read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findOneRole", null);
__decorate([
    (0, common_1.Post)('roles'),
    (0, require_access_decorator_1.RequireAccess)('roles', 'create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "createRole", null);
__decorate([
    (0, common_1.Delete)('roles/:id'),
    (0, require_access_decorator_1.RequireAccess)('roles', 'delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "deleteRole", null);
__decorate([
    (0, common_1.Get)('accesses'),
    (0, require_access_decorator_1.RequireAccess)('access', 'read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findAllAccesses", null);
__decorate([
    (0, common_1.Post)('accesses'),
    (0, require_access_decorator_1.RequireAccess)('access', 'create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "createAccess", null);
__decorate([
    (0, common_1.Delete)('accesses/:id'),
    (0, require_access_decorator_1.RequireAccess)('access', 'delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "deleteAccess", null);
__decorate([
    (0, common_1.Post)('roles/:roleId/accesses/:accessId'),
    (0, require_access_decorator_1.RequireAccess)('roles', 'update'),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, common_1.Param)('accessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "assignAccess", null);
__decorate([
    (0, common_1.Delete)('roles/:roleId/accesses/:accessId'),
    (0, require_access_decorator_1.RequireAccess)('roles', 'update'),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, common_1.Param)('accessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "removeAccess", null);
__decorate([
    (0, common_1.Get)('users/:userId/roles'),
    (0, require_access_decorator_1.RequireAccess)('users', 'read'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "getUserRoles", null);
__decorate([
    (0, common_1.Post)('users/:userId/roles/:roleId'),
    (0, require_access_decorator_1.RequireAccess)('users', 'update'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "assignRole", null);
__decorate([
    (0, common_1.Delete)('users/:userId/roles/:roleId'),
    (0, require_access_decorator_1.RequireAccess)('users', 'update'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "removeRole", null);
exports.RolesController = RolesController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, access_guard_1.AccessGuard),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map