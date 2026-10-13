import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes } from "crypto";
import * as argon2 from "argon2";
import { Response } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { OtpService, hashCode } from "./otp.service";
import { MailService } from "../notifications/mail.service";

const ACCESS_TTL = "15m";
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RT_COOKIE = "fliqo_rt";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private otp: OtpService,
    private mail: MailService
  ) {}

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(RT_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: REFRESH_TTL_MS,
      path: "/"
    });
  }

  private async issueSession(userId: string, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, type: user.type, roleId: user.roleId ?? null },
      { expiresIn: ACCESS_TTL }
    );
    const refreshToken = randomBytes(32).toString("hex");
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS)
      }
    });
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  async signup(name: string, email: string, password: string, marketingOptIn: boolean, res: Response) {
    const normalized = email.toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (exists) throw new ConflictException("Email already registered");
    const user = await this.prisma.user.create({
      data: {
        name,
        email: normalized,
        passwordHash: await argon2.hash(password),
        marketingOptIn,
        type: "CUSTOMER"
      }
    });
    // Nightly cleanup job (later phase) removes unverified accounts older than 7 days.
    const devCode = await this.otp.issueEmailVerify(normalized);
    return { userId: user.id, devCode };
  }

  async verifyEmail(email: string, code: string, res: Response) {
    const ok = await this.otp.verifyEmail(email, code);
    if (!ok) throw new BadRequestException("Invalid or expired code");
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) throw new BadRequestException("Invalid or expired code");
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() }
    });
    // Welcome email queued here in later phase.
    return this.issueSession(user.id, res);
  }

  async resendOtp(email: string) {
    // Always generic so responses never reveal whether an email is registered.
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user && !user.emailVerifiedAt) await this.otp.issueEmailVerify(email);
    return { message: "If the email needs verification, a new code was sent." };
  }

  async login(email: string, password: string, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Generic message to avoid user enumeration
    if (!user || user.status !== "ACTIVE") throw new UnauthorizedException("Invalid credentials");
    const ok = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    if (!user.emailVerifiedAt) {
      await this.otp.issueEmailVerify(user.email);
      return { needsVerification: true as const };
    }
    // Staff 2FA (email OTP factor; authenticator enrollment is a later phase)
    if (user.type === "STAFF" && user.twoFactorEnabled) {
      const code = String(randomBytes(3).readUIntBE(0, 3) % 900000 + 100000);
      await this.prisma.otp.deleteMany({ where: { target: `2fa:${user.id}`, purpose: "TWO_FACTOR" } });
      await this.prisma.otp.create({
        data: { target: `2fa:${user.id}`, codeHash: hashCode(code), purpose: "TWO_FACTOR", expiresAt: new Date(Date.now() + 10 * 60_000) }
      });
      await this.mail.send(user.email, "Your Fliqo staff login code", `<p>Your login code is <b>${code}</b>. Valid 10 minutes.</p>`);
      return { needs2FA: true as const, userId: user.id };
    }
    const session = await this.issueSession(user.id, res);
    return { needsVerification: false as const, ...session };
  }

  async refresh(cookies: Record<string, string>, res: Response) {
    const token = cookies?.[RT_COOKIE];
    if (!token) throw new UnauthorizedException();
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!row || row.revokedAt || row.expiresAt < new Date()) {
      // Possible reuse: if token unknown, revokeing family is handled by periodic cleanup;
      // on explicit reuse detection (revoked token presented) wipe all user sessions.
      if (row?.revokedAt) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: row.userId, revokedAt: null },
          data: { revokedAt: new Date() }
        });
      }
      throw new UnauthorizedException();
    }
    // Rotate
    await this.prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
    return this.issueSession(row.userId, res);
  }

  async logout(cookies: Record<string, string>, res: Response) {
    const token = cookies?.[RT_COOKIE];
    if (token) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(token) },
        data: { revokedAt: new Date() }
      });
    }
    res.clearCookie(RT_COOKIE, { path: "/" });
    return { message: "Logged out" };
  }

  me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        type: true,
        roleId: true,
        emailVerifiedAt: true,
        marketingOptIn: true,
        createdAt: true
      }
    });
  }

  async verify2FA(userId: string, code: string, res: Response) {
    const otp = await this.prisma.otp.findFirst({
      where: { target: `2fa:${userId}`, purpose: "TWO_FACTOR" },
      orderBy: { createdAt: "desc" }
    });
    if (!otp || otp.expiresAt < new Date() || otp.codeHash !== hashCode(code)) {
      throw new BadRequestException("Invalid or expired code");
    }
    await this.prisma.otp.delete({ where: { id: otp.id } });
    return this.issueSession(userId, res);
  }

  async set2FA(userId: string, enabled: boolean) {
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: enabled } });
    return { twoFactorEnabled: enabled };
  }
}
