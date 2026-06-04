import { PricingService } from './pricing.service';
export declare class PricingController {
    private readonly pricingService;
    constructor(pricingService: PricingService);
    findAll(): Promise<import("./entities/pricing-plan.entity").PricingPlan[]>;
    findAllAdmin(): Promise<import("./entities/pricing-plan.entity").PricingPlan[]>;
    create(body: {
        name: string;
        description?: string;
        tokenLimit: number;
        priceUsd: number;
        sortOrder?: number;
    }): Promise<import("./entities/pricing-plan.entity").PricingPlan>;
    update(id: string, body: Partial<{
        name: string;
        description: string | null;
        tokenLimit: number;
        priceUsd: number;
        isActive: boolean;
        sortOrder: number;
    }>): Promise<import("./entities/pricing-plan.entity").PricingPlan>;
    remove(id: string): Promise<void>;
}
