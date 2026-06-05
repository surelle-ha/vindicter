import { UsersService } from './users.service';
export declare class UsersController {
    private service;
    constructor(service: UsersService);
    findAll(): Promise<import("./entities/user.entity").User[]>;
    findOne(id: string): Promise<import("./entities/user.entity").User>;
    updateActive(id: string, isActive: boolean): Promise<import("./entities/user.entity").User>;
    updateRole(id: string, role: string): Promise<import("./entities/user.entity").User>;
    remove(id: string): Promise<void>;
}
