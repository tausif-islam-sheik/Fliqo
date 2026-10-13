import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import Redis from "ioredis";
import { PrismaService } from "../../prisma/prisma.service";
import { MockFlightProvider } from "./providers/mock.provider";
import { FlightOffer, FlightSearchParams } from "./providers/flight-provider.interface";

const CACHE_TTL_SEC = 5 * 60; // 5–15 min per PDF p.12

@Injectable()
export class FlightsService {
  private readonly logger = new Logger(FlightsService.name);
  private redis: Redis | null = null;
  private memory = new Map<string, { at: number; offers: FlightOffer[] }>();

  constructor(
    private prisma: PrismaService,
    private mock: MockFlightProvider
  ) {
    try {
      const url = process.env.REDIS_URL ?? "redis://localhost:6379";
      const client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
      client.on("error", () => {
        // Fall back to in-memory cache when Redis is unavailable (local dev)
        this.redis = null;
      });
      client.connect().catch(() => {
        this.redis = null;
      });
      this.redis = client;
    } catch {
      this.redis = null;
    }
  }

  private cacheKey(params: FlightSearchParams) {
    const h = createHash("sha256").update(JSON.stringify(params)).digest("hex").slice(0, 16);
    return `flights:${h}`;
  }

  async search(params: FlightSearchParams): Promise<{ offers: FlightOffer[]; cached: boolean }> {
    const key = this.cacheKey(params);
    // 1) Redis
    if (this.redis) {
      try {
        const hit = await this.redis.get(key);
        if (hit) return { offers: JSON.parse(hit) as FlightOffer[], cached: true };
      } catch {
        this.redis = null;
      }
    }
    // 2) Memory fallback
    const mem = this.memory.get(key);
    if (mem && Date.now() - mem.at < CACHE_TTL_SEC * 1000) {
      return { offers: mem.offers, cached: true };
    }
    // 3) Live (parallel suppliers later — mock only in Step 3)
    const required = { from: params.from, to: params.to, date: params.date };
    const offers = await this.mock.search({ ...params, ...required });
    this.memory.set(key, { at: Date.now(), offers });
    if (this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(offers), "EX", CACHE_TTL_SEC);
      } catch {
        this.redis = null;
      }
    }
    // Funnel logging (best-effort)
    this.prisma.analyticsEvent
      .create({ data: { type: "SEARCH", productType: "FLIGHT", route: `${params.from}-${params.to}` } })
      .catch(() => {});
    return { offers, cached: false };
  }

  reprice(offerId: string) {
    // Booking always re-prices live — never trusts cached/search prices (PDF p.28)
    return this.mock.reprice(offerId);
  }

  private faresCache = new Map<string, { at: number; data: Array<{ date: string; minPrice: number | null }> }>();

  /**
   * Per-day minimum fares for a month — powers the fare calendar.
   * Runs independent mock searches in parallel; results cached for 5 min.
   * Past days return minPrice null (not bookable).
   */
  async fares(params: { from: string; to: string; month: string }) {
    const key = `fares:${params.from}-${params.to}-${params.month}`;
    const hit = this.faresCache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_SEC * 1000) return hit.data;
    const [y, m] = params.month.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const today = new Date().toISOString().slice(0, 10);
    const data = await Promise.all(
      Array.from({ length: daysInMonth }, (_, i) => {
        const date = `${params.month}-${String(i + 1).padStart(2, "0")}`;
        if (date < today) return Promise.resolve({ date, minPrice: null as number | null });
        return this.mock
          .search({ from: params.from, to: params.to, date })
          .then((offers) => ({ date, minPrice: Math.min(...offers.map((o) => o.price)) }));
      })
    );
    this.faresCache.set(key, { at: Date.now(), data });
    return data;
  }

  airports(q?: string) {
    return this.prisma.airport.findMany({
      where: q ? { OR: [{ code: { contains: q.toUpperCase() } }, { name: { contains: q } }, { city: { contains: q } }] } : undefined,
      take: 10,
      orderBy: { code: "asc" }
    });
  }
}
