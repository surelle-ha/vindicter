"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmtpService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
let SmtpService = class SmtpService {
    isConfigured() {
        return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
    }
    configSummary() {
        return {
            configured: this.isConfigured(),
            host: process.env.SMTP_HOST ?? null,
            port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null,
            secure: process.env.SMTP_SECURE === 'true',
            fromEmail: process.env.SMTP_FROM_EMAIL ?? null,
            fromName: process.env.SMTP_FROM_NAME ?? null,
        };
    }
    async send(payload) {
        if (!this.isConfigured()) {
            throw new common_1.BadRequestException('SMTP is not configured. Set SMTP_HOST and SMTP_PORT before sending email.');
        }
        const auth = process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' }
            : undefined;
        const options = {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth,
        };
        const transport = nodemailer.createTransport(options);
        const fromEmail = process.env.SMTP_FROM_EMAIL ?? payload.fromEmail;
        const fromName = process.env.SMTP_FROM_NAME ?? payload.fromName;
        return transport.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: payload.to,
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
        });
    }
};
exports.SmtpService = SmtpService;
exports.SmtpService = SmtpService = __decorate([
    (0, common_1.Injectable)()
], SmtpService);
//# sourceMappingURL=smtp.service.js.map