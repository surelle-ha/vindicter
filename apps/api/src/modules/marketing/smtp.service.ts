import { BadRequestException, Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

export interface MailPayload {
  fromName: string
  fromEmail: string
  to: string[]
  subject: string
  text: string
  html: string
}

@Injectable()
export class SmtpService {
  isConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT)
  }

  configSummary() {
    return {
      configured: this.isConfigured(),
      host: process.env.SMTP_HOST ?? null,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null,
      secure: process.env.SMTP_SECURE === 'true',
      fromEmail: process.env.SMTP_FROM_EMAIL ?? null,
      fromName: process.env.SMTP_FROM_NAME ?? null,
    }
  }

  async send(payload: MailPayload) {
    if (!this.isConfigured()) {
      throw new BadRequestException('SMTP is not configured. Set SMTP_HOST and SMTP_PORT before sending email.')
    }

    const auth = process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' }
      : undefined

    const options: SMTPTransport.Options = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth,
    }

    const transport = nodemailer.createTransport(options)
    const fromEmail = process.env.SMTP_FROM_EMAIL ?? payload.fromEmail
    const fromName = process.env.SMTP_FROM_NAME ?? payload.fromName

    return transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    })
  }
}
