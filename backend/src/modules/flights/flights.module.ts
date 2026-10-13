import { Module } from "@nestjs/common";
import { FlightsController } from "./flights.controller";
import { FlightsService } from "./flights.service";
import { MockFlightProvider } from "./providers/mock.provider";

@Module({
  controllers: [FlightsController],
  providers: [FlightsService, MockFlightProvider],
  exports: [FlightsService]
})
export class FlightsModule {}
