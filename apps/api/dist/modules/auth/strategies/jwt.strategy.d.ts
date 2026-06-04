import { Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../roles/entities/user-role.entity';
interface JwtPayload {
    sub: string;
    email: string;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private userRepo;
    private userRoleRepo;
    constructor(userRepo: Repository<User>, userRoleRepo: Repository<UserRole>);
    validate(payload: JwtPayload): Promise<{
        id: string;
        email: string;
        displayName: string | null;
        roles: string[];
        accesses: string[];
    }>;
}
export {};
