import { Injectable } from "@nestjs/common";
import { createHash, randomInt } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../notifications/mail.service";
import { OtpPurpose } from "@prisma/client";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService
  ) {}

  async issueEmailVerify(email: string) {
    const target = email.toLowerCase();
    await this.prisma.otp.deleteMany({ where: { target, purpose: "EMAIL_VERIFY" } });
    const code = String(randomInt(100000, 1000000));
    await this.prisma.otp.create({
      data: {
        target,
        codeHash: hashCode(code),
        purpose: "EMAIL_VERIFY" as OtpPurpose,
        expiresAt: new Date(Date.now() + OTP_TTL_MS)
      }
    });
    await this.mail.sendOtp(target, code);
    // Return code only in non-production to ease local dev without Mailpit
    return process.env.NODE_ENV === "production" ? null : code;
  }

  async verifyEmail(email: string, code: string) {
    const target = email.toLowerCase();
    const otp = await this.prisma.otp.findFirst({
      where: { target, purpose: "EMAIL_VERIFY" },
      orderBy: { createdAt: "desc" }
    });
    if (!otp) return false;
    if (otp.expiresAt < new Date()) {
      await this.prisma.otp.delete({ where: { id: otp.id } });
      return false;
    }
    if (otp.attempts >= MAX_ATTEMPTS) return false;
    if (otp.codeHash !== hashCode(code)) {
      await this.prisma.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      return false;
    }
    await this.prisma.otp.delete({ where: { id: otp.id } });
    return true;
  }
}
