import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
declare class UpdateProfileDto {
    displayName: string;
}
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    login(dto: LoginDto): Promise<{
        access_token: string;
    }>;
    register(dto: RegisterDto): Promise<{
        access_token: string;
    }>;
    me(user: any): Promise<{
        roles: any;
        accesses: any;
        id?: string | undefined;
        email?: string | undefined;
        displayName?: string | null | undefined;
        passwordHash?: string | undefined;
        isActive?: boolean | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        userRoles?: import("../roles/entities/user-role.entity").UserRole[] | undefined;
        apiTokens?: import("../api-tokens/entities/api-token.entity").ApiToken[] | undefined;
    }>;
    updateProfile(user: any, dto: UpdateProfileDto): Promise<void>;
}
export {};
