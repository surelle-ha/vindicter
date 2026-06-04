import { Repository } from 'typeorm';
import { NewsletterSignup } from './entities/newsletter-signup.entity';
import { NewsletterUpdate } from './entities/newsletter-update.entity';
export declare class NewsletterService {
    private signupRepo;
    private updateRepo;
    constructor(signupRepo: Repository<NewsletterSignup>, updateRepo: Repository<NewsletterUpdate>);
    upsertSignup(email: string, accountType?: string): Promise<{
        email: string;
        downloadToken: string;
    }>;
    findSignupByToken(token: string): Promise<{
        email: string;
        downloadToken: string | null;
    }>;
    findAllSignups(): Promise<NewsletterSignup[]>;
    findPublishedUpdates(limit?: number): Promise<NewsletterUpdate[]>;
    findAllUpdates(): Promise<NewsletterUpdate[]>;
    createUpdate(data: Partial<NewsletterUpdate>): Promise<NewsletterUpdate>;
    updateOne(id: string, data: Partial<NewsletterUpdate>): Promise<NewsletterUpdate>;
    removeUpdate(id: string): Promise<void>;
}
