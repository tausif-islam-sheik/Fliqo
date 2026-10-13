import { Controller, Get, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { FlightsService } from "./flights.service";

@Public()
@Controller("flights")
export class FlightsController {
  constructor(private flights: FlightsService) {}

  @Get("search")
  search(
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("date") date: string,
    @Query("returnDate") returnDate?: string,
    @Query("adt") adt?: string
  ) {
    if (!from || !to || !date) throw new Error("from, to and date are required (YYYY-MM-DD)");
    return this.flights.search({ from, to, date, returnDate, adt: adt ? Number(adt) : 1 });
  }

  @Get("reprice")
  reprice(@Query("offerId") offerId: string) {
    return this.flights.reprice(offerId);
  }

  @Get("fares")
  fares(@Query("from") from: string, @Query("to") to: string, @Query("month") month: string) {
    if (!from || !to || !/^\d{4}-\d{2}$/.test(month ?? "")) throw new Error("from, to and month (YYYY-MM) are required");
    return this.flights.fares({ from, to, month });
  }

  @Get("airports")
  airports(@Query("q") q?: string) {
    return this.flights.airports(q);
  }
}
