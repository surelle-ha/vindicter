import { Repository } from 'typeorm';
import { PricingPlan } from './entities/pricing-plan.entity';
export declare class PricingService {
    private planRepo;
    constructor(planRepo: Repository<PricingPlan>);
    findAll(adminView?: boolean): Promise<PricingPlan[]>;
    findOne(id: string): Promise<PricingPlan>;
    create(dto: {
        name: string;
        description?: string;
        tokenLimit: number;
        priceUsd: number;
        sortOrder?: number;
    }): Promise<PricingPlan>;
    update(id: string, dto: Partial<{
        name: string;
        description: string | null;
        tokenLimit: number;
        priceUsd: number;
        isActive: boolean;
        sortOrder: number;
    }>): Promise<PricingPlan>;
    remove(id: string): Promise<void>;
}
