import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ToursService } from "./tours.service";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentUser, RequestUser } from "../../common/decorators/current-user.decorator";

@Controller("tours")
export class ToursController {
  constructor(private tours: ToursService) {}

  @Public()
  @Get()
  browse() {
    return this.tours.browse();
  }

  @Public()
  @Get(":slug")
  details(@Param("slug") slug: string) {
    return this.tours.details(slug);
  }

  @Post("book")
  book(@CurrentUser() user: RequestUser, @Body() body: any) {
    return this.tours.book(user.sub, body);
  }

  @Post("admin/package")
  @RequirePermissions("tours.manage")
  upsertPackage(@Body() body: any) {
    return this.tours.upsertPackage(body);
  }

  @Post("admin/departure")
  @RequirePermissions("tours.manage")
  upsertDeparture(@Body() body: any) {
    return this.tours.upsertDeparture(body);
  }
}
