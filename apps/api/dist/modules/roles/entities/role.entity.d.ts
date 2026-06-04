import { RoleAccess } from './role-access.entity';
import { UserRole } from './user-role.entity';
export declare class Role {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    roleAccesses: RoleAccess[];
    userRoles: UserRole[];
}
