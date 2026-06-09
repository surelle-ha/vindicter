import type { FastifyReply } from 'fastify';
import { NewsletterService } from './newsletter.service';
declare class SignupDto {
    email: string;
    accountType?: string;
}
export declare class NewsletterController {
    private service;
    constructor(service: NewsletterService);
    upsertSignup(dto: SignupDto): Promise<{
        success: boolean;
    }>;
    findByToken(token: string): Promise<{
        valid: boolean;
    }>;
    downloadByToken(token: string, res: FastifyReply): Promise<void>;
    findAllSignups(): Promise<import("./entities/newsletter-signup.entity").NewsletterSignup[]>;
}
export {};
