import type SMTPTransport from 'nodemailer/lib/smtp-transport';
export interface MailPayload {
    fromName: string;
    fromEmail: string;
    to: string[];
    subject: string;
    text: string;
    html: string;
}
export declare class SmtpService {
    isConfigured(): boolean;
    configSummary(): {
        configured: boolean;
        host: string | null;
        port: number | null;
        secure: boolean;
        fromEmail: string | null;
        fromName: string | null;
    };
    send(payload: MailPayload): Promise<SMTPTransport.SentMessageInfo>;
}
