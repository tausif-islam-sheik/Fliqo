import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { VisaService } from "./visa.service";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentUser, RequestUser } from "../../common/decorators/current-user.decorator";

@Controller("visa")
export class VisaController {
  constructor(private visa: VisaService) {}

  @Public()
  @Get("countries")
  countries() {
    return this.visa.countries();
  }

  @Public()
  @Get("countries/:code")
  requirements(@Param("code") code: string) {
    return this.visa.requirements(code);
  }

  @Post("apply")
  apply(@CurrentUser() user: RequestUser, @Body() body: any) {
    return this.visa.apply(user.sub, body);
  }

  @Get("track/:ref")
  track(@CurrentUser() user: RequestUser, @Param("ref") ref: string) {
    return this.visa.track(user.sub, user.type, ref);
  }

  @Get("admin/queue")
  @RequirePermissions("bookings.view")
  queue(@Query("status") status?: string) {
    return this.visa.queue(status);
  }

  @Post("admin/status")
  @RequirePermissions("bookings.view")
  setStatus(@Body() body: { bookingId: string; status: string }) {
    return this.visa.setStatus(body.bookingId, body.status);
  }

  @Post("admin/country")
  @RequirePermissions("tours.manage")
  upsertCountry(@Body() body: any) {
    return this.visa.upsertCountry(body);
  }
}
