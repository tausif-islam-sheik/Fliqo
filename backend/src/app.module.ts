import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { Reflector } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { FlightsModule } from "./modules/flights/flights.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { HotelsModule } from "./modules/hotels/hotels.module";
import { ToursModule } from "./modules/tours/tours.module";
import { VisaModule } from "./modules/visa/visa.module";
import { AdminModule } from "./modules/admin/admin.module";
import { ContentModule } from "./modules/content/content.module";
import { CampaignsModule } from "./modules/campaigns/campaigns.module";
import { BackupsModule } from "./modules/backups/backups.module";
import { StaffModule } from "./modules/staff/staff.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, UsersModule, FlightsModule, BookingsModule, PaymentsModule, HotelsModule, ToursModule, VisaModule, AdminModule, ContentModule, CampaignsModule, BackupsModule, StaffModule],
  controllers: [],
  providers: [
    Reflector,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard }
  ]
})
export class AppModule {}
