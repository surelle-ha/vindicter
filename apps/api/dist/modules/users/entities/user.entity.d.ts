import { UserRole } from '../../roles/entities/user-role.entity';
import { ApiToken } from '../../api-tokens/entities/api-token.entity';
export declare class User {
    id: string;
    email: string;
    displayName: string | null;
    passwordHash: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    userRoles: UserRole[];
    apiTokens: ApiToken[];
}
