"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, MapPin, Star, Tag } from "lucide-react";
import { api } from "@/lib/api/client";
import { useHotelSearch } from "@/lib/query/catalog";
import { useTours } from "@/lib/query/catalog";
import { Badge, bdt, Btn, Card, EmptyState, LoadingState, SectionHead } from "@/components/ui";

export function FeaturedTours() {
  const { data, isLoading } = useTours();
  const tours = (data ?? []).slice(0, 3);

  return (
    <section>
      <SectionHead
        eyebrow="Handpicked"
        title="Popular tour packages"
        subtitle="Fixed departures with confirmed seats — book in minutes."
        action={<Btn href="/tours" variant="outline" size="sm">View all tours <ArrowRight className="h-4 w-4" /></Btn>}
      />
      {isLoading ? (
        <LoadingState label="Loading tours…" />
      ) : tours.length === 0 ? (
        <EmptyState title="No tours right now" hint="New departures are added every week." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((t: any) => (
            <Card key={t.id} className="flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-pop">
              <div className="gloss flex h-28 items-end bg-gradient-to-br from-brand-800 via-blue-700 to-sky-400 p-4 ring-1 ring-white/20 ring-inset">
                <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <MapPin className="h-4 w-4" /> {t.destination}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="font-extrabold text-slate-900">{t.title}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                  <CalendarDays className="h-4 w-4" /> {t.durationDays} days
                </p>
                <div className="mt-3 flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-xs text-slate-400">From</p>
                    <p className="text-lg font-extrabold text-brand-700">{bdt(t.basePrice)}</p>
                  </div>
                  <Btn href={`/tours/${t.slug}`} size="sm">View</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

export function FeaturedHotels() {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const { data, isLoading } = useHotelSearch({ city: "Cox's Bazar", checkIn: today, checkOut: tomorrow });
  const hotels = (data ?? []).slice(0, 3);

  return (
    <section>
      <SectionHead
        eyebrow="Stay"
        title="Featured hotels in Cox's Bazar"
        subtitle="Direct-contract rates with instant confirmation."
        action={<Btn href="/hotels/search" variant="outline" size="sm">Search hotels <ArrowRight className="h-4 w-4" /></Btn>}
      />
      {isLoading ? (
        <LoadingState label="Loading hotels…" />
      ) : hotels.length === 0 ? (
        <EmptyState title="No hotels right now" hint="Try searching another city or date." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((h: any) => (
            <Card key={h.id} className="p-5 transition hover:-translate-y-0.5 hover:shadow-pop">
              <div className="flex items-start justify-between gap-2">
                <p className="font-extrabold text-slate-900">{h.name}</p>
                {h.featured && <Badge tone="amber"><Star className="h-3 w-3" /> Featured</Badge>}
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-4 w-4" /> {h.city} · {"★".repeat(h.stars ?? 3)}
              </p>
              <p className="mt-2 line-clamp-1 text-sm text-slate-500">{(h.amenities ?? []).join(" · ")}</p>
              <Btn
                href={`/hotels/${h.slug}?checkIn=${today}&checkOut=${tomorrow}`}
                variant="outline"
                size="sm"
                className="mt-4 w-full"
              >
                View rooms
              </Btn>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

export function OffersPreview() {
  const { data, isLoading } = useQuery({ queryKey: ["offers"], queryFn: () => api<any[]>("/offers") });
  const offers = (data ?? []).slice(0, 3);
  if (isLoading || offers.length === 0) return null;

  return (
    <section>
      <SectionHead
        eyebrow="Deals"
        title="Today's offers"
        action={<Btn href="/offers" variant="outline" size="sm">All offers <ArrowRight className="h-4 w-4" /></Btn>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((o: any) => (
          <Card key={o.id} className="border-gold-300 bg-gradient-to-br from-gold-100 to-white p-5">
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-gold-700 uppercase">
              <Tag className="h-3.5 w-3.5" /> Limited time
            </p>
            <p className="mt-1 font-extrabold text-slate-900">{o.title}</p>
            {o.validTo && (
              <p className="mt-1 text-xs text-slate-500">
                Valid until {new Date(o.validTo).toLocaleDateString()}
              </p>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
