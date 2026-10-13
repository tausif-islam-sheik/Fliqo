import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface RequestUser {
  sub: string;
  type: "CUSTOMER" | "STAFF";
  roleId: string | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  }
);
