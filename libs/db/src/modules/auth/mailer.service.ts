import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('smtp.host'),
      port: this.config.get<number>('smtp.port'),
      secure: this.config.get<number>('smtp.port') === 465,
      auth: {
        user: this.config.get<string>('smtp.user'),
        pass: this.config.get<string>('smtp.password'),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('smtp.from'),
        to,
        subject,
        html,
      });
    } catch (err) {
      // Do not block the API flow if email sending fails; just log it.
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    const subject = 'Verify your email';
    const html = `<p>Welcome to OTT Platform. Use this token to verify your email:</p>
      <p><strong>${token}</strong></p>
      <p>This token expires in 24 hours.</p>`;
    await this.sendMail(to, subject, html);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const subject = 'Reset your password';
    const html = `<p>You requested a password reset. Use this token to reset your password:</p>
      <p><strong>${token}</strong></p>
      <p>If you did not request this, you can safely ignore this email. This token expires in 1 hour.</p>`;
    await this.sendMail(to, subject, html);
  }
}
