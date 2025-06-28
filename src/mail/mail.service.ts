import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  async sendOtpLink(from: string, to: string, otpLink: string) {
    await this.transporter.sendMail({
      from: from,
      to: to,
      subject: 'Set your password',
      html: `
        <p>Hello,</p>
        <p>You have been invited to the Admin Portal.</p>
        <p>Please click the following link to set your password (valid for 10 minutes):</p>
        <p><a href="${otpLink}">${otpLink}</a></p>
        <p>If you didn’t request this, you can ignore this email.</p>
      `,
    });
  }
}
