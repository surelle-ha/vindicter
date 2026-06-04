import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Access } from './entities/access.entity';
import { RoleAccess } from './entities/role-access.entity';
import { UserRole } from './entities/user-role.entity';
export declare class RolesService {
    private roleRepo;
    private accessRepo;
    private roleAccessRepo;
    private userRoleRepo;
    constructor(roleRepo: Repository<Role>, accessRepo: Repository<Access>, roleAccessRepo: Repository<RoleAccess>, userRoleRepo: Repository<UserRole>);
    findAllRoles(): Promise<Role[]>;
    findOneRole(id: string): Promise<Role>;
    createRole(name: string, description?: string): Promise<Role>;
    deleteRole(id: string): Promise<void>;
    findAllAccesses(): Promise<Access[]>;
    createAccess(resource: string, action: string, description?: string): Promise<Access>;
    deleteAccess(id: string): Promise<void>;
    assignAccessToRole(roleId: string, accessId: string): Promise<RoleAccess>;
    removeAccessFromRole(roleId: string, accessId: string): Promise<void>;
    assignRoleToUser(userId: string, roleId: string): Promise<UserRole>;
    removeRoleFromUser(userId: string, roleId: string): Promise<void>;
    getUserRoles(userId: string): Promise<UserRole[]>;
}
