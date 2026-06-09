import { UserRole } from '../../roles/entities/user-role.entity';
export declare class User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    passwordHash: string;
    jobRole: string | null;
    experienceLevel: string | null;
    onboardingComplete: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    userRoles: UserRole[];
    get fullName(): string | null;
}
