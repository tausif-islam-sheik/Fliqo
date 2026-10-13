import { Module } from "@nestjs/common";
import { BackupsController } from "./backups.controller";
import { BackupsService } from "./backups.service";
import { MaintenanceService } from "../../common/maintenance/maintenance.service";
import { MailService } from "../notifications/mail.service";

@Module({
  controllers: [BackupsController],
  providers: [BackupsService, MaintenanceService, MailService],
  exports: [MaintenanceService]
})
export class BackupsModule {}
