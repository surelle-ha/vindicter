import { NewsletterService } from './newsletter.service';
declare class SignupDto {
    email: string;
    accountType?: string;
}
export declare class NewsletterController {
    private service;
    constructor(service: NewsletterService);
    upsertSignup(dto: SignupDto): Promise<{
        email: string;
        downloadToken: string;
    }>;
    findByToken(token: string): Promise<{
        email: string;
        downloadToken: string | null;
    }>;
    getPublished(limit?: string): Promise<import("./entities/newsletter-update.entity").NewsletterUpdate[]>;
    findAllSignups(): Promise<import("./entities/newsletter-signup.entity").NewsletterSignup[]>;
    findAllUpdates(): Promise<import("./entities/newsletter-update.entity").NewsletterUpdate[]>;
    createUpdate(body: any): Promise<import("./entities/newsletter-update.entity").NewsletterUpdate>;
    updateOne(id: string, body: any): Promise<import("./entities/newsletter-update.entity").NewsletterUpdate>;
    removeUpdate(id: string): Promise<void>;
}
export {};
