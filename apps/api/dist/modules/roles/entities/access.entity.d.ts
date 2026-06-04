import { RoleAccess } from './role-access.entity';
export declare class Access {
    id: string;
    resource: string;
    action: string;
    description: string | null;
    createdAt: Date;
    roleAccesses: RoleAccess[];
}
