import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { StaffService } from "./staff.service";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentUser, RequestUser } from "../../common/decorators/current-user.decorator";

@Controller()
export class StaffController {
  constructor(private staff: StaffService) {}

  @Get("staff")
  @RequirePermissions("staff.manage")
  list() {
    return this.staff.staff();
  }

  @Get("staff/invites")
  @RequirePermissions("staff.manage")
  invites() {
    return this.staff.invites();
  }

  @Post("staff/invite")
  @RequirePermissions("staff.manage")
  invite(@CurrentUser() user: RequestUser, @Body() body: any) {
    return this.staff.invite(user.sub, body);
  }

  @Public()
  @Post("staff/accept")
  accept(@Body() body: { token: string; password: string }) {
    return this.staff.accept(body);
  }

  @Post("staff/:id/role")
  @RequirePermissions("staff.manage")
  setRole(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: { roleId: string }) {
    return this.staff.setRole(user.sub, id, body.roleId);
  }

  @Post("staff/:id/suspend")
  @RequirePermissions("staff.manage")
  suspend(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: { suspend: boolean }) {
    return this.staff.suspend(user.sub, id, body.suspend);
  }

  @Post("staff/:id/force-logout")
  @RequirePermissions("staff.manage")
  forceLogout(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.staff.forceLogout(user.sub, id);
  }

  @Get("roles")
  @RequirePermissions("staff.manage")
  roles() {
    return this.staff.roles();
  }

  @Get("permissions")
  @RequirePermissions("staff.manage")
  permissions() {
    return this.staff.permissions();
  }

  @Post("roles")
  @RequirePermissions("staff.manage")
  saveRole(@CurrentUser() user: RequestUser, @Body() body: any) {
    return this.staff.saveRole(user.sub, body);
  }

  @Get("activity")
  @RequirePermissions("staff.manage")
  activity(@Query("actorId") actorId?: string) {
    return this.staff.activity(actorId);
  }
}
