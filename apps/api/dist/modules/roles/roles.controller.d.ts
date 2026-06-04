import { RolesService } from './roles.service';
export declare class RolesController {
    private service;
    constructor(service: RolesService);
    findAllRoles(): Promise<import("./entities/role.entity").Role[]>;
    findOneRole(id: string): Promise<import("./entities/role.entity").Role>;
    createRole(body: {
        name: string;
        description?: string;
    }): Promise<import("./entities/role.entity").Role>;
    deleteRole(id: string): Promise<void>;
    findAllAccesses(): Promise<import("./entities/access.entity").Access[]>;
    createAccess(body: {
        resource: string;
        action: string;
        description?: string;
    }): Promise<import("./entities/access.entity").Access>;
    deleteAccess(id: string): Promise<void>;
    assignAccess(roleId: string, accessId: string): Promise<import("./entities/role-access.entity").RoleAccess>;
    removeAccess(roleId: string, accessId: string): Promise<void>;
    getUserRoles(userId: string): Promise<import("./entities/user-role.entity").UserRole[]>;
    assignRole(userId: string, roleId: string): Promise<import("./entities/user-role.entity").UserRole>;
    removeRole(userId: string, roleId: string): Promise<void>;
}
