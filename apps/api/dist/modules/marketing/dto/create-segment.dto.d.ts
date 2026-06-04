import type { MarketingSegmentStatus } from '../entities/marketing-segment.entity';
export declare class CreateSegmentDto {
    name: string;
    source?: string;
    ownerTeam?: string;
    status?: MarketingSegmentStatus;
}
