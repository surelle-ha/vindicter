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
exports.RoleAccess = void 0;
const typeorm_1 = require("typeorm");
const role_entity_1 = require("./role.entity");
const access_entity_1 = require("./access.entity");
let RoleAccess = class RoleAccess {
};
exports.RoleAccess = RoleAccess;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RoleAccess.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_entity_1.Role, (r) => r.roleAccesses, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'role_id' }),
    __metadata("design:type", role_entity_1.Role)
], RoleAccess.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => access_entity_1.Access, (a) => a.roleAccesses, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'access_id' }),
    __metadata("design:type", access_entity_1.Access)
], RoleAccess.prototype, "access", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], RoleAccess.prototype, "createdAt", void 0);
exports.RoleAccess = RoleAccess = __decorate([
    (0, typeorm_1.Entity)('roles_access')
], RoleAccess);
//# sourceMappingURL=role-access.entity.js.map