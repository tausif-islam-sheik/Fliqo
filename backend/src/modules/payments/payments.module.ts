import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { TicketingService } from "./ticketing.service";
import { MockGateway } from "./gateways/mock.gateway";
import { MailService } from "../notifications/mail.service";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, TicketingService, MockGateway, MailService],
  exports: [PaymentsService]
})
export class PaymentsModule {}
