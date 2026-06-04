export type TicketCategory = 'setup' | 'scan' | 'billing' | 'bug' | 'other';
export type TicketStatus = 'open' | 'reviewing' | 'closed';
export declare class SupportTicket {
    id: string;
    name: string;
    email: string;
    category: TicketCategory;
    subject: string;
    message: string;
    documentationChecked: boolean;
    faqChecked: boolean;
    sourceUrl: string | null;
    status: TicketStatus;
    createdAt: Date;
}
