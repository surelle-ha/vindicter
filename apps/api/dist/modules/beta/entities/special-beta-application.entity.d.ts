export type BetaStatus = 'pending' | 'approved' | 'rejected';
export declare class SpecialBetaApplication {
    id: string;
    orgName: string;
    orgSize: string;
    country: string;
    contactName: string;
    contactEmail: string;
    partnerType: string;
    referral: string | null;
    agreedTerms: boolean;
    status: BetaStatus;
    createdAt: Date;
}
