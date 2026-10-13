import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { HotelsService } from "./hotels.service";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentUser, RequestUser } from "../../common/decorators/current-user.decorator";

@Controller("hotels")
export class HotelsController {
  constructor(private hotels: HotelsService) {}

  @Public()
  @Get("search")
  search(@Query("city") city: string, @Query("checkIn") checkIn: string, @Query("checkOut") checkOut: string, @Query("guests") guests?: string) {
    return this.hotels.search({ city, checkIn, checkOut, guests: guests ? Number(guests) : 1 });
  }

  @Public()
  @Get(":id")
  details(@Param("id") id: string) {
    return this.hotels.details(id);
  }

  @Post("book")
  book(@CurrentUser() user: RequestUser, @Body() body: any) {
    return this.hotels.book(user.sub, body);
  }

  @Post("cancel")
  cancel(@CurrentUser() user: RequestUser, @Body() body: { bookingRef: string }) {
    return this.hotels.cancel(user.sub, user.type, body.bookingRef);
  }

  @Post("admin/upsert")
  @RequirePermissions("tours.manage")
  upsert(@Body() body: any) {
    return this.hotels.upsertHotel(body);
  }
}
