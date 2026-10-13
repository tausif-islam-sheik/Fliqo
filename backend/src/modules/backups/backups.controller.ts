import { Body, Controller, ForbiddenException, Get, Param, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { BackupsService } from "./backups.service";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentUser, RequestUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../prisma/prisma.service";

@Controller("backups")
export class BackupsController {
  constructor(
    private backups: BackupsService,
    private prisma: PrismaService
  ) {}

  private async isSuperAdmin(userId: string) {
    const me = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    return me?.role?.name === "SuperAdmin";
  }

  @Get()
  @RequirePermissions("backups.manage")
  list() {
    return this.backups.list();
  }

  @Get("health")
  @RequirePermissions("backups.manage")
  health() {
    return this.backups.health();
  }

  @Post("run")
  @RequirePermissions("backups.manage")
  run(@CurrentUser() user: RequestUser, @Body() body: { note?: string }) {
    return this.backups.runNow(user.sub, body.note);
  }

  @Get(":id/download")
  @RequirePermissions("backups.manage")
  async download(@CurrentUser() user: RequestUser, @Param("id") id: string, @Res() res: Response) {
    if (!(await this.isSuperAdmin(user.sub))) throw new ForbiddenException("SuperAdmin only");
    const row = await this.prisma.backup.findUnique({ where: { id } });
    if (!row) throw new ForbiddenException("Not found");
    res.download(this.backups.filePath(row.fileName), row.fileName);
  }

  @Post("restore-code")
  @RequirePermissions("backups.manage")
  restoreCode(@CurrentUser() user: RequestUser) {
    return this.backups.requestRestoreCode(user.sub);
  }

  @Post("restore")
  @RequirePermissions("backups.manage")
  restore(
    @CurrentUser() user: RequestUser,
    @Body() body: { backupId: string; confirmDatabase: string; code: string }
  ) {
    return this.backups.restore(user.sub, body.backupId, body.confirmDatabase, body.code);
  }
}
