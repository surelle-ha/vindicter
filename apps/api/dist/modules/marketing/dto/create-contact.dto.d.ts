import type { MarketingContactStatus } from '../entities/marketing-contact.entity';
export declare class CreateContactDto {
    email: string;
    name?: string;
    company?: string;
    segmentId?: string;
    status?: MarketingContactStatus;
}
