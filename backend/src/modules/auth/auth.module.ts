import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthController, TwoFactorController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { OtpService } from "./otp.service";
import { JwtStrategy } from "./jwt.strategy";
import { MailService } from "../notifications/mail.service";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-only-change-me",
      signOptions: { expiresIn: "15m" }
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])
  ],
  controllers: [AuthController, TwoFactorController],
  providers: [AuthService, OtpService, JwtStrategy, MailService],
  exports: [AuthService]
})
export class AuthModule {}
