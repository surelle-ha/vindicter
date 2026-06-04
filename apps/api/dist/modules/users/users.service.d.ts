import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private repo;
    constructor(repo: Repository<User>);
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    updateActive(id: string, isActive: boolean): Promise<User>;
    remove(id: string): Promise<void>;
}
