import { Repository } from 'typeorm';
import { SpecialBetaApplication, BetaStatus } from './entities/special-beta-application.entity';
export declare class BetaService {
    private repo;
    constructor(repo: Repository<SpecialBetaApplication>);
    create(data: Omit<SpecialBetaApplication, 'id' | 'createdAt' | 'status'>): Promise<SpecialBetaApplication>;
    findAll(): Promise<SpecialBetaApplication[]>;
    updateStatus(id: string, status: BetaStatus): Promise<SpecialBetaApplication>;
    remove(id: string): Promise<void>;
}
