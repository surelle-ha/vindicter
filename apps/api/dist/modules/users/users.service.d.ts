import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
export declare class UsersService {
    private repo;
    private userRoleRepo;
    private roleRepo;
    constructor(repo: Repository<User>, userRoleRepo: Repository<UserRole>, roleRepo: Repository<Role>);
    findAll(): Promise<User[]>;
    updateRole(userId: string, roleName: string): Promise<User>;
    findOne(id: string): Promise<User>;
    updateActive(id: string, isActive: boolean): Promise<User>;
    remove(id: string): Promise<void>;
}
