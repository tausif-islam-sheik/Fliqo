import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CampaignsService } from "./campaigns.service";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("campaigns")
export class CampaignsController {
  constructor(private campaigns: CampaignsService) {}

  @Get()
  @RequirePermissions("campaigns.manage")
  list() {
    return this.campaigns.list();
  }

  @Post()
  @RequirePermissions("campaigns.manage")
  create(@Body() body: any) {
    return this.campaigns.create(body);
  }

  @Get(":id")
  @RequirePermissions("campaigns.manage")
  report(@Param("id") id: string) {
    return this.campaigns.report(id);
  }

  @Post(":id/start")
  @RequirePermissions("campaigns.manage")
  start(@Param("id") id: string) {
    return this.campaigns.start(id);
  }

  @Post(":id/pause")
  @RequirePermissions("campaigns.manage")
  pause(@Param("id") id: string) {
    return this.campaigns.pause(id);
  }

  @Post(":id/test")
  @RequirePermissions("campaigns.manage")
  test(@Param("id") id: string, @Body() body: { email: string }) {
    return this.campaigns.testSend(id, body.email);
  }
}
