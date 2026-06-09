import { Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../roles/entities/user-role.entity';
import { WorkspaceMember } from '../../workspaces/entities/workspace-member.entity';
interface JwtPayload {
    sub: string;
    email: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private userRepo;
    private userRoleRepo;
    private memberRepo;
    constructor(userRepo: Repository<User>, userRoleRepo: Repository<UserRole>, memberRepo: Repository<WorkspaceMember>);
    validate(payload: JwtPayload): Promise<{
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        roles: string[];
        accesses: string[];
        workspaces: {
            id: string;
            name: string;
            memberRole: string;
        }[];
    }>;
}
export {};
