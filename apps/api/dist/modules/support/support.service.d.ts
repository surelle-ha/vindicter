import { Repository } from 'typeorm';
import { SupportTicket, TicketStatus } from './entities/support-ticket.entity';
export declare class SupportService {
    private repo;
    constructor(repo: Repository<SupportTicket>);
    create(data: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>): Promise<SupportTicket>;
    findAll(): Promise<SupportTicket[]>;
    updateStatus(id: string, status: TicketStatus): Promise<SupportTicket>;
    remove(id: string): Promise<void>;
}
