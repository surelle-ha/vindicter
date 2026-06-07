import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { PricingPlan } from '../pricing/entities/pricing-plan.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private userRepo;
    private userRoleRepo;
    private roleRepo;
    private wsRepo;
    private memRepo;
    private subRepo;
    private planRepo;
    private jwt;
    constructor(userRepo: Repository<User>, userRoleRepo: Repository<UserRole>, roleRepo: Repository<Role>, wsRepo: Repository<Workspace>, memRepo: Repository<WorkspaceMember>, subRepo: Repository<Subscription>, planRepo: Repository<PricingPlan>, jwt: JwtService);
    login(dto: LoginDto): Promise<{
        access_token: string;
    }>;
    private verifyTurnstile;
    register(dto: RegisterDto): Promise<{
        access_token: string;
    }>;
    me(userId: string): Promise<User | null>;
    updateProfile(userId: string, dto: {
        firstName?: string;
        lastName?: string;
        jobRole?: string;
        experienceLevel?: string;
        onboardingComplete?: boolean;
    }): Promise<User | null>;
}
