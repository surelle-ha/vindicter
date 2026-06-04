import { ApiTokensService } from './api-tokens.service';
export declare class ApiTokensController {
    private service;
    constructor(service: ApiTokensService);
    create(user: any, name: string, expiresAt?: string): Promise<{
        token: string;
        id: string;
        user: import("../users/entities/user.entity").User;
        name: string;
        tokenPrefix: string;
        expiresAt: Date | null;
        lastUsedAt: Date | null;
        createdAt: Date;
    }>;
    findAll(user: any): Promise<import("./entities/api-token.entity").ApiToken[]>;
    revoke(user: any, id: string): Promise<void>;
}
