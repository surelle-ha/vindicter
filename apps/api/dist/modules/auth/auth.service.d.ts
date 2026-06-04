import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private userRepo;
    private userRoleRepo;
    private roleRepo;
    private jwt;
    constructor(userRepo: Repository<User>, userRoleRepo: Repository<UserRole>, roleRepo: Repository<Role>, jwt: JwtService);
    login(dto: LoginDto): Promise<{
        access_token: string;
    }>;
    private verifyTurnstile;
    register(dto: RegisterDto): Promise<{
        access_token: string;
    }>;
    me(userId: string): Promise<User | null>;
    updateDisplayName(userId: string, displayName: string): Promise<void>;
}
