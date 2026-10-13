import { Module } from "@nestjs/common";
import { StaffController } from "./staff.controller";
import { StaffService } from "./staff.service";
import { AuditService } from "../../common/audit/audit.service";
import { MailService } from "../notifications/mail.service";

@Module({
  controllers: [StaffController],
  providers: [StaffService, AuditService, MailService]
})
export class StaffModule {}
