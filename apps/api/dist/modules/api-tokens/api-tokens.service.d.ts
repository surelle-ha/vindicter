import { Repository } from 'typeorm';
import { ApiToken } from './entities/api-token.entity';
export declare class ApiTokensService {
    private repo;
    constructor(repo: Repository<ApiToken>);
    create(userId: string, name: string, expiresAt?: Date): Promise<{
        token: string;
        id: string;
        user: import("../users/entities/user.entity").User;
        name: string;
        tokenPrefix: string;
        expiresAt: Date | null;
        lastUsedAt: Date | null;
        createdAt: Date;
    }>;
    findByUser(userId: string): Promise<ApiToken[]>;
    revoke(userId: string, tokenId: string): Promise<void>;
}
