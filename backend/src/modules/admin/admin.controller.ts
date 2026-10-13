import { Controller, Get, Param, Query } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("admin")
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get("dashboard/kpis")
  @RequirePermissions("bookings.view")
  kpis(@Query("from") from?: string, @Query("to") to?: string) {
    return this.admin.kpis(from, to);
  }

  @Get("dashboard/charts/:name")
  @RequirePermissions("bookings.view")
  chart(@Param("name") name: string, @Query("from") from?: string, @Query("to") to?: string) {
    return this.admin.chart(name, from, to);
  }

  @Get("bookings")
  @RequirePermissions("bookings.view")
  bookings(@Query("status") status?: string, @Query("type") type?: string) {
    return this.admin.bookings(status, type);
  }

  @Get("users")
  @RequirePermissions("users.view")
  users(@Query("q") q?: string) {
    return this.admin.users(q);
  }

  @Get("needs-action")
  @RequirePermissions("bookings.view")
  needsAction() {
    return this.admin.needsAction();
  }
}
