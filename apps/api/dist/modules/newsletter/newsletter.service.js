"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NewsletterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsletterService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const nanoid_1 = require("nanoid");
const newsletter_signup_entity_1 = require("./entities/newsletter-signup.entity");
const smtp_service_1 = require("../marketing/smtp.service");
const MANIFEST_URL = 'https://pub-1dcbd264e42f475e9f95858cc16ab6b7.r2.dev/releases/latest/update.json';
let NewsletterService = NewsletterService_1 = class NewsletterService {
    constructor(signupRepo, smtp) {
        this.signupRepo = signupRepo;
        this.smtp = smtp;
        this.logger = new common_1.Logger(NewsletterService_1.name);
    }
    async upsertSignup(email, accountType = 'individual') {
        const existing = await this.signupRepo.findOneBy({ email: email.toLowerCase() });
        const token = (0, nanoid_1.nanoid)(32);
        if (existing) {
            existing.downloadToken = token;
            await this.signupRepo.save(existing);
        }
        else {
            const signup = this.signupRepo.create({ email: email.toLowerCase(), downloadToken: token, accountType });
            await this.signupRepo.save(signup);
        }
        this.sendDownloadEmail(email.toLowerCase(), token).catch(err => this.logger.error(`Failed to send download email to ${email}: ${err?.message}`));
        return { success: true };
    }
    async sendDownloadEmail(email, token) {
        if (!this.smtp.isConfigured())
            return;
        const base = process.env.API_PUBLIC_URL ?? 'http://localhost:4000';
        const downloadUrl = `${base}/api/v1/newsletter/signups/download/${token}`;
        await this.smtp.send({
            fromName: process.env.SMTP_FROM_NAME ?? 'Vindicter',
            fromEmail: process.env.SMTP_FROM_EMAIL ?? 'noreply@vindicter.xyz',
            to: [email],
            subject: 'Your Vindicter download link',
            text: [
                'Hi,',
                '',
                "Thanks for joining the Vindicter open beta! Here's your personal download link:",
                '',
                downloadUrl,
                '',
                'The link is yours to keep — bookmark it for future updates.',
                'If you have any questions, reply to this email or visit https://vindicter.xyz/support',
                '',
                '— The Vindicter Team',
            ].join('\n'),
            html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1012;font-family:Inter,system-ui,sans-serif;color:#e4e4e7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#18191c;border-radius:16px;border:1px solid #2a2b2f;padding:40px 36px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#6b7280;">Open Beta</p>
          <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#f4f4f5;">Your download link is ready</h1>
          <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#9ca3af;">
            Thanks for joining the Vindicter open beta. Click the button below to download the app — the link is personal to you and reusable for future updates.
          </p>
          <a href="${downloadUrl}"
             style="display:inline-block;background:#6366f1;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;">
            Download Vindicter →
          </a>
          <p style="margin:28px 0 0;font-size:12px;color:#6b7280;line-height:1.6;">
            Windows 10 / 11 · x64 · Free<br>
            Windows SmartScreen may appear — click <strong style="color:#9ca3af;">More info</strong> then <strong style="color:#9ca3af;">Run anyway</strong>.
          </p>
          <hr style="margin:28px 0;border:none;border-top:1px solid #2a2b2f;">
          <p style="margin:0;font-size:11px;color:#4b5563;">
            If you didn't request this email, you can safely ignore it.<br>
            Questions? <a href="https://vindicter.xyz/support" style="color:#6366f1;">Visit support</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
        });
    }
    async findSignupByToken(token) {
        const signup = await this.signupRepo.findOneBy({ downloadToken: token });
        if (!signup)
            throw new common_1.NotFoundException('Token not found');
        return { valid: true };
    }
    async getDownloadUrlForToken(token) {
        const signup = await this.signupRepo.findOneBy({ downloadToken: token });
        if (!signup)
            throw new common_1.NotFoundException('Token not found');
        const res = await fetch(MANIFEST_URL);
        if (!res.ok)
            throw new Error(`Manifest fetch failed: ${res.status}`);
        const data = await res.json();
        const url = data.platforms?.['windows-x86_64']?.url;
        if (!url)
            throw new Error('No Windows URL in manifest');
        return url;
    }
    findAllSignups() {
        return this.signupRepo.find({ order: { createdAt: 'DESC' } });
    }
};
exports.NewsletterService = NewsletterService;
exports.NewsletterService = NewsletterService = NewsletterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(newsletter_signup_entity_1.NewsletterSignup)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        smtp_service_1.SmtpService])
], NewsletterService);
//# sourceMappingURL=newsletter.service.js.map