import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { nanoid } from 'nanoid'
import { NewsletterSignup } from './entities/newsletter-signup.entity'
import { NewsletterUpdate } from './entities/newsletter-update.entity'
import { SmtpService } from '../marketing/smtp.service'

const MANIFEST_URL = 'https://pub-1dcbd264e42f475e9f95858cc16ab6b7.r2.dev/releases/latest/update.json'

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name)

  constructor(
    @InjectRepository(NewsletterSignup) private signupRepo:  Repository<NewsletterSignup>,
    @InjectRepository(NewsletterUpdate) private updateRepo: Repository<NewsletterUpdate>,
    private smtp: SmtpService,
  ) {}

  // ── Signups ────────────────────────────────────────────────────────────────
  async upsertSignup(email: string, accountType = 'individual') {
    const existing = await this.signupRepo.findOneBy({ email: email.toLowerCase() })
    const token = nanoid(32)
    if (existing) {
      existing.downloadToken = token
      await this.signupRepo.save(existing)
    } else {
      const signup = this.signupRepo.create({ email: email.toLowerCase(), downloadToken: token, accountType })
      await this.signupRepo.save(signup)
    }

    this.sendDownloadEmail(email.toLowerCase(), token).catch(err =>
      this.logger.error(`Failed to send download email to ${email}: ${err?.message}`)
    )

    return { email: email.toLowerCase(), downloadToken: token }
  }

  private async sendDownloadEmail(email: string, token: string) {
    if (!this.smtp.isConfigured()) return

    const base        = process.env.API_PUBLIC_URL ?? 'http://localhost:4000'
    const downloadUrl = `${base}/api/v1/newsletter/signups/download/${token}`

    await this.smtp.send({
      fromName:  process.env.SMTP_FROM_NAME  ?? 'Vindicter',
      fromEmail: process.env.SMTP_FROM_EMAIL ?? 'noreply@vindicter.xyz',
      to:        [email],
      subject:   'Your Vindicter download link',
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
    })
  }

  async findSignupByToken(token: string) {
    const signup = await this.signupRepo.findOneBy({ downloadToken: token })
    if (!signup) throw new NotFoundException('Token not found')
    return { email: signup.email, downloadToken: signup.downloadToken }
  }

  async getDownloadUrlForToken(token: string): Promise<string> {
    const signup = await this.signupRepo.findOneBy({ downloadToken: token })
    if (!signup) throw new NotFoundException('Token not found')

    const res = await fetch(MANIFEST_URL)
    if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`)
    const data = await res.json() as { platforms: Record<string, { url: string }> }
    const url = data.platforms?.['windows-x86_64']?.url
    if (!url) throw new Error('No Windows URL in manifest')
    return url
  }

  findAllSignups() {
    return this.signupRepo.find({ order: { createdAt: 'DESC' } })
  }

  // ── Updates ────────────────────────────────────────────────────────────────
  findPublishedUpdates(limit?: number) {
    const query = this.updateRepo
      .createQueryBuilder('u')
      .where('u.status = :status', { status: 'published' })
      .orderBy('u.published_at', 'DESC')
    if (limit) query.take(limit)
    return query.getMany()
  }

  findAllUpdates() {
    return this.updateRepo.find({ order: { createdAt: 'DESC' } })
  }

  async createUpdate(data: Partial<NewsletterUpdate>) {
    const update = this.updateRepo.create(data)
    return this.updateRepo.save(update)
  }

  async updateOne(id: string, data: Partial<NewsletterUpdate>) {
    const update = await this.updateRepo.findOneBy({ id })
    if (!update) throw new NotFoundException('Update not found')
    Object.assign(update, data)
    if (data.status === 'published' && !update.publishedAt) {
      update.publishedAt = new Date()
    }
    return this.updateRepo.save(update)
  }

  async removeUpdate(id: string) {
    const update = await this.updateRepo.findOneBy({ id })
    if (!update) throw new NotFoundException('Update not found')
    await this.updateRepo.remove(update)
  }
}
