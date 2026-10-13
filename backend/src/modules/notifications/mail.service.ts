import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

/** Single mail abstraction — swap provider without touching modules (PDF p.14). */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false
  });

  async sendOtp(email: string, code: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM ?? "Fliqo <no-reply@fliqo.local>",
        to: email,
        subject: "Your Fliqo verification code",
        text: `Your verification code is ${code}. It expires in 10 minutes.`
      });
    } catch (e) {
      // Dev without Mailpit: log instead of failing signup
      this.logger.warn(`Mail failed, OTP for ${email}: ${code} (${(e as Error).message})`);
    }
  }

  /** Generic send behind one abstraction (PDF p.14). Returns provider message id. */
  async send(to: string, subject: string, html: string, headers?: Record<string, string>) {
    const info = await this.transporter.sendMail({
      from: process.env.MAIL_FROM ?? "Fliqo <no-reply@fliqo.local>",
      to,
      subject,
      html,
      headers
    });
    return (info?.messageId as string) ?? `mock-${Date.now()}`;
  }
}
