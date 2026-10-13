import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/** Blocks booking/payment endpoints until the email is verified (PDF p.13). */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass()
    ]);
    if (isPublic) return true;
    const req = ctx.switchToHttp().getRequest();
    const userId = req.user?.sub;
    if (!userId) return true;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && !user.emailVerifiedAt) {
      throw new ForbiddenException("Email verification required");
    }
    return true;
  }
}
