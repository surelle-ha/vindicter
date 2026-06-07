export declare class PricingPlan {
    id: string;
    name: string;
    description: string | null;
    tokenLimit: number;
    seatLimit: number;
    projectLimit: number;
    priceUsd: number;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
