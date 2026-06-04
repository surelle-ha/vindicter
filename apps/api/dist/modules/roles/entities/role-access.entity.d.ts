import { Role } from './role.entity';
import { Access } from './access.entity';
export declare class RoleAccess {
    id: string;
    role: Role;
    access: Access;
    createdAt: Date;
}
