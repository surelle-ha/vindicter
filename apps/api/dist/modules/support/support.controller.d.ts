import { SupportService } from './support.service';
export declare class SupportController {
    private service;
    constructor(service: SupportService);
    create(body: any): Promise<import("./entities/support-ticket.entity").SupportTicket>;
    findAll(): Promise<import("./entities/support-ticket.entity").SupportTicket[]>;
    updateStatus(id: string, status: any): Promise<import("./entities/support-ticket.entity").SupportTicket>;
    remove(id: string): Promise<void>;
}
