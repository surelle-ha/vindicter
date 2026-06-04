import { User } from '../../users/entities/user.entity';
export declare class ApiToken {
    id: string;
    user: User;
    name: string;
    token: string;
    tokenPrefix: string;
    expiresAt: Date | null;
    lastUsedAt: Date | null;
    createdAt: Date;
}
