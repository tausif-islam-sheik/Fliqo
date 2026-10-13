import { Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser, RequestUser } from "../../common/decorators/current-user.decorator";

@Public()
@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("signup")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  signup(
    @Body() body: { name: string; email: string; password: string; marketingOptIn?: boolean },
    @Res({ passthrough: true }) res: Response
  ) {
    return this.auth.signup(body.name, body.email, body.password, body.marketingOptIn ?? false, res);
  }

  @Post("verify-email")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifyEmail(
    @Body() body: { email: string; code: string },
    @Res({ passthrough: true }) res: Response
  ) {
    return this.auth.verifyEmail(body.email, body.code, res);
  }

  @Post("resend-otp")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  resendOtp(@Body() body: { email: string }) {
    return this.auth.resendOtp(body.email);
  }

  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response
  ) {
    return this.auth.login(body.email, body.password, res);
  }

  @Post("refresh")
  @HttpCode(200)
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.refresh(req.cookies ?? {}, res);
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.logout(req.cookies ?? {}, res);
  }

  @Post("verify-2fa")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verify2FA(@Body() body: { userId: string; code: string }, @Res({ passthrough: true }) res: Response) {
    return this.auth.verify2FA(body.userId, body.code, res);
  }
}

// Authenticated 2FA self-service (NOT public — separate controller so guards apply)
@Controller("auth/2fa")
export class TwoFactorController {
  constructor(private auth: AuthService) {}

  @Post("enable")
  @HttpCode(200)
  enable(@CurrentUser() user: RequestUser) {
    return this.auth.set2FA(user.sub, true);
  }

  @Post("disable")
  @HttpCode(200)
  disable(@CurrentUser() user: RequestUser) {
    return this.auth.set2FA(user.sub, false);
  }
}
