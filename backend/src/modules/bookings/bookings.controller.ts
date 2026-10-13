import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { BookingsService, PassengerInput } from "./bookings.service";
import { CurrentUser, RequestUser } from "../../common/decorators/current-user.decorator";

@Controller("bookings")
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  @Post("flight")
  createFlight(
    @CurrentUser() user: RequestUser,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body()
    body: {
      offerId: string;
      passengers: PassengerInput[];
      contactEmail: string;
      contactPhone: string;
    }
  ) {
    return this.bookings.createFlightBooking(user.sub, { ...body, idempotencyKey });
  }

  @Get(":ref")
  getByRef(@CurrentUser() user: RequestUser, @Param("ref") ref: string) {
    return this.bookings.getByRef(user.sub, user.type, ref);
  }

  @Post("expire-sweep")
  expireSweep() {
    return this.bookings.expireUnpaid();
  }
}
