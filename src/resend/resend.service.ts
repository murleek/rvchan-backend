import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { SendEmailOptions } from './types/resend.types';
import { TemplateService } from './template.service';

@Injectable()
export class ResendService {
  private resend: Resend;
  private defaultFrom: string;

  constructor(private readonly templateService: TemplateService) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.defaultFrom = process.env.RESEND_FROM_EMAIL!;
  }

  async sendEmail(options: SendEmailOptions) {
    const { to, subject, html, text, from } = options;

    return this.resend.emails.send({
      from: from || this.defaultFrom,
      to,
      subject,
      html,
      text,
    });
  }

  async sendOtpEmail(to: string, otp: string) {
    const html = await this.templateService.render('otp-code', {
      otp,
      ttl: 300,
    });

    return this.sendEmail({
      to,
      subject: 'your OTP code',
      html,
    });
  }
}
