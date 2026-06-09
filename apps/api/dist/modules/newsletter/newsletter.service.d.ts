import { Repository } from 'typeorm';
import { NewsletterSignup } from './entities/newsletter-signup.entity';
import { SmtpService } from '../marketing/smtp.service';
export declare class NewsletterService {
    private signupRepo;
    private smtp;
    private readonly logger;
    constructor(signupRepo: Repository<NewsletterSignup>, smtp: SmtpService);
    upsertSignup(email: string, accountType?: string): Promise<{
        success: boolean;
    }>;
    private sendDownloadEmail;
    findSignupByToken(token: string): Promise<{
        valid: boolean;
    }>;
    getDownloadUrlForToken(token: string): Promise<string>;
    findAllSignups(): Promise<NewsletterSignup[]>;
}
