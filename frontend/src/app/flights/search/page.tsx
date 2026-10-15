"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Clock, Luggage, Plane, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useFlightSearch } from "@/lib/query/flights";
import { FlightSearchForm } from "@/components/search/FlightSearchForm";
import {
  Badge,
  bdt,
  Btn,
  Card,
  Container,
  EmptyState,
  LoadingState,
  Alert,
  inputCls
} from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDur(min: number) {
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function Results() {
  const params = useSearchParams();
  const router = useRouter();
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const date = params.get("date") ?? "";
  const adt = Number(params.get("adt") ?? 1);
  const returnDate = params.get("returnDate") ?? "";

  const { data, isLoading, isError, refetch, isPlaceholderData } = useFlightSearch(
    from && to && date ? { from, to, date, adt } : null
  );
  const offers = data?.offers ?? [];

  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [stops, setStops] = useState<number[]>([]);
  const [airlines, setAirlines] = useState<string[]>([]);
  const [sort, setSort] = useState<"price-asc" | "price-desc" | "duration">("price-asc");

  const allAirlines = useMemo(() => [...new Set(offers.map((o) => o.airline))], [offers]);
  const priceCap = useMemo(() => Math.max(0, ...offers.map((o) => o.price)), [offers]);
  const priceFloor = useMemo(
    () => (offers.length ? Math.min(...offers.map((o) => o.price)) : 0),
    [offers]
  );

  const filtered = useMemo(() => {
    const list = [...offers];
    const out = list.filter(
      (o) =>
        (maxPrice == null || o.price <= maxPrice) &&
        (!stops.length || stops.includes(o.stops)) &&
        (!airlines.length || airlines.includes(o.airline))
    );
    out.sort((a, b) =>
      sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : a.durationMin - b.durationMin
    );
    return out;
  }, [offers, maxPrice, stops, airlines, sort]);

  function toggle<T>(list: T[], v: T, set: (next: T[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  return (
    <Container className="py-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <span className="text-2xl font-black tracking-tight text-slate-900">
          {from || "–––"} <span className="text-brand-500">→</span> {to || "–––"}
        </span>
        <Badge tone="slate">{date || "Pick a date"}</Badge>
        <Badge tone="slate">{adt} adult{adt > 1 ? "s" : ""}</Badge>
        {returnDate ? (
          <Badge tone="blue">↩ {returnDate}</Badge>
        ) : (
          <Badge tone="slate">One way</Badge>
        )}
      </div>

      <Card className="mt-4 p-4 sm:p-5">
        <FlightSearchForm initial={{ from, to, date, adt }} />
      </Card>

      {isLoading && (
        <div className="mt-4 space-y-3">
          <LoadingState label="Searching live fares…" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white" />
          ))}
        </div>
      )}
      {isError && (
        <div className="mt-4">
          <Alert tone="red">
            Search failed.{" "}
            <button onClick={() => refetch()} className="font-bold underline">
              Retry
            </button>
          </Alert>
        </div>
      )}
      {data && (
        <p className="mt-4 text-sm text-slate-500">
          <b className="text-slate-900">{offers.length}</b> flights{" "}
          <Badge tone={data.cached ? "amber" : "green"}>{data.cached ? "cached" : "live"}</Badge>{" "}
          {isPlaceholderData && <span className="italic">· updating…</span>}
        </p>
      )}

      {offers.length > 0 && (
        <div className="mt-4 flex flex-col gap-5 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-64">
            <Card className="p-5 lg:sticky lg:top-32">
              <p className="flex items-center gap-2 font-extrabold text-slate-900">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-600">Max price</span>
                  <span className="font-extrabold text-brand-700">{bdt(maxPrice ?? priceCap)}</span>
                </div>
                <input
                  type="range"
                  min={priceFloor}
                  max={priceCap}
                  value={maxPrice ?? priceCap}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="mt-2 w-full accent-brand-600"
                  aria-label="Max price"
                />
              </div>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-sm font-bold text-slate-700">Stops</p>
                <div className="mt-2 space-y-2">
                  {[0, 1].map((s) => (
                    <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                      <Checkbox
                        checked={stops.includes(s)}
                        onCheckedChange={() => toggle(stops, s, setStops)}
                        aria-label={s === 0 ? "Nonstop" : "1 stop"}
                      />
                      {s === 0 ? "Nonstop" : "1 stop"}
                    </label>
                  ))}
                </div>
              </div>
              {allAirlines.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-sm font-bold text-slate-700">Airline</p>
                  <div className="mt-2 space-y-2">
                    {allAirlines.map((a) => (
                      <label key={a} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                        <Checkbox
                          checked={airlines.includes(a)}
                          onCheckedChange={() => toggle(airlines, a, setAirlines)}
                          aria-label={a}
                        />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-sm font-bold text-slate-700">Sort</p>
                <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                  <SelectTrigger className="mt-2" aria-label="Sort">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price-asc">Price: low → high</SelectItem>
                    <SelectItem value="price-desc">Price: high → low</SelectItem>
                    <SelectItem value="duration">Fastest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(maxPrice != null || stops.length > 0 || airlines.length > 0) && (
                <button
                  onClick={() => {
                    setMaxPrice(null);
                    setStops([]);
                    setAirlines([]);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Clear filters
                </button>
              )}
            </Card>
          </aside>

          <div className="grid flex-1 content-start gap-3">
            {filtered.length === 0 && (
              <EmptyState title="No flights match" hint="Try removing a filter or searching nearby dates." />
            )}
            {filtered.map((o) => (
              <Card key={o.id} className="p-4 transition hover:shadow-pop sm:p-5">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex min-w-44 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <Plane className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-extrabold text-slate-900">{o.airlineName}</p>
                      <p className="text-xs text-slate-500">{o.flightNo} · {o.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-center">
                    <div>
                      <p className="text-lg font-extrabold text-slate-900">{fmtTime(o.depart)}</p>
                      <p className="text-xs font-bold text-slate-400">{o.from}</p>
                    </div>
                    <div className="w-24 sm:w-32">
                      <p className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-500">
                        <Clock className="h-3 w-3" /> {fmtDur(o.durationMin)}
                      </p>
                      <div className="relative my-1 h-0.5 rounded bg-slate-200">
                        <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-brand-500 bg-white" />
                      </div>
                      <p className="text-xs font-semibold text-brand-700">
                        {o.stops === 0 ? "Nonstop" : "1 stop"}
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-slate-900">{fmtTime(o.arrive)}</p>
                      <p className="text-xs font-bold text-slate-400">{o.to}</p>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-black tracking-tight text-brand-700">{bdt(o.price)}</p>
                      <p className="flex items-center justify-end gap-1 text-xs text-slate-500">
                        <Luggage className="h-3 w-3" /> {o.baggage}
                      </p>
                    </div>
                    <Btn
                      size="lg"
                      onClick={() => router.push(`/flights/booking?offer=${encodeURIComponent(o.id)}&adt=${adt}`)}
                    >
                      Select <ArrowRight className="h-4 w-4" />
                    </Btn>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}

export default function FlightSearchPage() {
  return (
    <Suspense fallback={<Container className="py-8"><LoadingState label="Loading search…" /></Container>}>
      <Results />
    </Suspense>
  );
}
