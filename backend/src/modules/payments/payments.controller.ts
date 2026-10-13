import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentUser, RequestUser } from "../../common/decorators/current-user.decorator";

@Controller("payments")
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post("init")
  init(
    @CurrentUser() user: RequestUser,
    @Headers("idempotency-key") key: string | undefined,
    @Body() body: { bookingRef: string }
  ) {
    return this.payments.init(user.sub, body.bookingRef, key);
  }

  /** Gateway server-to-server callback — public but idempotent. */
  @Public()
  @Post("ipn")
  ipn(@Body() body: { gatewayTxnId: string; success: boolean }) {
    return this.payments.handleIpn(body.gatewayTxnId, body.success);
  }

  /** Mock gateway display page data — amount only, no PII. */
  @Public()
  @Get("session")
  session(@Query("txn") txn: string) {
    return this.payments.session(txn);
  }

  @Post(":id/refund")
  @RequirePermissions("bookings.refund")
  refund(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body() body: { amount?: number }
  ) {
    return this.payments.refund(user.sub, user.type, id, body.amount);
  }

  @Get("invoice")
  invoice(
    @CurrentUser() user: RequestUser,
    @Query("bookingRef") bookingRef: string
  ) {
    return this.payments.invoice(bookingRef, user.sub, user.type);
  }
}
