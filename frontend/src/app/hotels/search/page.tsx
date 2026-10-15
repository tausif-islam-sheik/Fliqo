"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, MapPin, Search as SearchIcon, Star } from "lucide-react";
import { useHotelSearch } from "@/lib/query/catalog";
import { Badge, Btn, Card, Container, DatePicker, EmptyState, LoadingState, PageHeader, inputCls } from "@/components/ui";

function Search() {
  const params = useSearchParams();
  const router = useRouter();
  const [city, setCity] = useState(params.get("city") ?? "Cox's Bazar");
  const [checkIn, setCheckIn] = useState(params.get("checkIn") ?? new Date().toISOString().slice(0, 10));
  const [checkOut, setCheckOut] = useState(params.get("checkOut") ?? new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const active = params.get("city") ? { city: params.get("city")!, checkIn: params.get("checkIn")!, checkOut: params.get("checkOut")! } : null;
  const { data, isLoading } = useHotelSearch(active);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/hotels/search?${new URLSearchParams({ city, checkIn, checkOut }).toString()}`);
  }

  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Hotels"
        title={active ? `Stays in ${active.city}` : "Find your stay"}
        subtitle={active ? `${active.checkIn} → ${active.checkOut}` : "Search contracted hotels with instant confirmation."}
      />
      <Card className="p-4 sm:p-5">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500 uppercase">City</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" aria-label="City" className={inputCls} />
          </label>
          <div className="block">
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500 uppercase">Check-in</span>
            <DatePicker value={checkIn} onChange={setCheckIn} min={new Date().toISOString().slice(0, 10)} ariaLabel="Check-in" />
          </div>
          <div className="block">
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500 uppercase">Check-out</span>
            <DatePicker value={checkOut} onChange={setCheckOut} min={checkIn} ariaLabel="Check-out" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700">
              <SearchIcon className="h-4 w-4" /> Search
            </button>
          </div>
        </form>
      </Card>

      {isLoading && (
        <div className="mt-4">
          <LoadingState label="Loading hotels…" />
        </div>
      )}
      <div className="mt-4 grid gap-3">
        {data?.map((h: any) => (
          <Card key={h.id} className="flex flex-wrap items-center gap-4 p-5 transition hover:shadow-pop">
            {h.images?.[0] ? (
              <img
                src={h.images[0]}
                alt={h.name}
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                className="h-16 w-24 shrink-0 rounded-lg bg-brand-50 object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Building2 className="h-6 w-6" />
              </span>
            )}
            <div className="min-w-52 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-extrabold text-slate-900">
                {h.name}
                {h.featured && <Badge tone="amber"><Star className="h-3 w-3" /> Featured</Badge>}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5" /> {h.city} · <span className="text-gold-500">{"★".repeat(h.stars)}</span>
              </p>
              <p className="mt-1 line-clamp-1 text-sm text-slate-500">{(h.amenities ?? []).join(" · ")}</p>
            </div>
            <Btn
              onClick={() => router.push(`/hotels/${h.slug}?checkIn=${active?.checkIn}&checkOut=${active?.checkOut}`)}
              variant="outline"
            >
              View rooms
            </Btn>
          </Card>
        ))}
        {active && data?.length === 0 && (
          <EmptyState title="No hotels found" hint="Try another city or different dates." />
        )}
        {!active && !isLoading && (
          <EmptyState title="Search to see hotels" hint="Pick a city and dates above to see live availability and rates." />
        )}
      </div>
    </Container>
  );
}

export default function HotelSearchPage() {
  return (
    <Suspense fallback={<Container className="py-8"><LoadingState /></Container>}>
      <Search />
    </Suspense>
  );
}
