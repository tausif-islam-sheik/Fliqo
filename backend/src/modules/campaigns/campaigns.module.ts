import { Module } from "@nestjs/common";
import { CampaignsController } from "./campaigns.controller";
import { TrackingController } from "./tracking.controller";
import { CampaignsService } from "./campaigns.service";
import { MailService } from "../notifications/mail.service";

@Module({
  controllers: [CampaignsController, TrackingController],
  providers: [CampaignsService, MailService]
})
export class CampaignsModule {}
