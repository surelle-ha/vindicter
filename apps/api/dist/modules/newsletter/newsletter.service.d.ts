import { Repository } from 'typeorm';
import { NewsletterSignup } from './entities/newsletter-signup.entity';
import { NewsletterUpdate } from './entities/newsletter-update.entity';
import { SmtpService } from '../marketing/smtp.service';
export declare class NewsletterService {
    private signupRepo;
    private updateRepo;
    private smtp;
    private readonly logger;
    constructor(signupRepo: Repository<NewsletterSignup>, updateRepo: Repository<NewsletterUpdate>, smtp: SmtpService);
    upsertSignup(email: string, accountType?: string): Promise<{
        email: string;
        downloadToken: string;
    }>;
    private sendDownloadEmail;
    findSignupByToken(token: string): Promise<{
        email: string;
        downloadToken: string | null;
    }>;
    getDownloadUrlForToken(token: string): Promise<string>;
    findAllSignups(): Promise<NewsletterSignup[]>;
    findPublishedUpdates(limit?: number): Promise<NewsletterUpdate[]>;
    findAllUpdates(): Promise<NewsletterUpdate[]>;
    createUpdate(data: Partial<NewsletterUpdate>): Promise<NewsletterUpdate>;
    updateOne(id: string, data: Partial<NewsletterUpdate>): Promise<NewsletterUpdate>;
    removeUpdate(id: string): Promise<void>;
}
