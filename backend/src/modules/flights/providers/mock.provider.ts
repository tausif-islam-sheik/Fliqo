import { Injectable } from "@nestjs/common";
import {
  FlightOffer,
  FlightProvider,
  FlightSearchParams
} from "./flight-provider.interface";

/**
 * Stand-in for Mystifly/TBO aggregator (PDF p.7). Deterministic mock so local
 * dev never hits real suppliers. Swap with a real adapter implementing the
 * same interface — the rest of the app never sees supplier formats.
 */
@Injectable()
export class MockFlightProvider implements FlightProvider {
  readonly name = "mock";
  private offers = new Map<string, { offer: FlightOffer; at: number }>();

  private seed(params: FlightSearchParams): number {
    const s = `${params.from}${params.to}${params.date}${params.returnDate ?? ""}`;
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  async search(
    params: Required<Pick<FlightSearchParams, "from" | "to" | "date">> & FlightSearchParams
  ): Promise<FlightOffer[]> {
    const h = this.seed(params);
    const base = 6500 + (h % 9000);
    const airlines = [
      { code: "BG", name: "Biman Bangladesh", no: "BG-40" },
      { code: "BS", name: "US-Bangla Airlines", no: "BS-14" },
      { code: "VQ", name: "Novoair", no: "VQ-93" }
    ];
    const offers = airlines.map((a, i) => {
      const depart = new Date(`${params.date}T0${7 + i}:30:00`);
      const mins = 55 + ((h >> (i * 3)) % 120) + i * 40;
      const arrive = new Date(depart.getTime() + mins * 60_000);
      const price = Math.round(base * (1 + i * 0.12 + ((h >> i) % 7) / 100));
      const offer: FlightOffer = {
        id: `mock_${params.from}_${params.to}_${params.date}_${i}`,
        provider: this.name,
        airline: a.code,
        airlineName: a.name,
        flightNo: `${a.no}${h % 10}`,
        from: params.from,
        to: params.to,
        depart: depart.toISOString(),
        arrive: arrive.toISOString(),
        stops: i === 2 ? 1 : 0,
        durationMin: mins,
        price,
        currency: "BDT",
        baggage: "20kg"
      };
      this.offers.set(offer.id, { offer, at: Date.now() });
      return offer;
    });
    // Simulate supplier latency without blocking search too long
    await new Promise((r) => setTimeout(r, 120));
    return offers;
  }

  async reprice(offerId: string): Promise<FlightOffer> {
    const hit = this.offers.get(offerId);
    if (hit && Date.now() - hit.at < 30 * 60_000) return hit.offer;
    // Rebuild deterministically if server restarted (id encodes route+date+index)
    const m = offerId.match(/^mock_([A-Z]{3})_([A-Z]{3})_(\d{4}-\d{2}-\d{2})_(\d)$/);
    if (!m) throw new Error("Offer expired — please search again");
    const [, from, to, date, idx] = m;
    const offers = await this.search({ from, to, date });
    const offer = offers[Number(idx)];
    if (!offer) throw new Error("Offer expired — please search again");
    return offer;
  }
}
