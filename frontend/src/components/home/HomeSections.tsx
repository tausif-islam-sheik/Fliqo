"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, MapPin, Star, Tag } from "lucide-react";
import { api } from "@/lib/api/client";
import { useHotelSearch } from "@/lib/query/catalog";
import { useTours } from "@/lib/query/catalog";
import { Badge, bdt, Btn, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, EmptyState, LoadingState, SectionHead } from "@/components/ui";

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
              <div className="relative flex h-28 items-end overflow-hidden bg-gradient-to-br from-brand-800 via-blue-700 to-sky-400 p-4">
                {t.images?.[0] && (
                  <img
                    src={t.images[0]}
                    alt={t.title}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-transparent to-transparent" />
                <span className="relative flex items-center gap-1.5 text-sm font-bold text-white text-shadow-hero">
                  <MapPin className="h-4 w-4" /> {t.destination}
                </span>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t.title}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" /> {t.durationDays} days
                </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto items-end justify-between gap-2 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-xs text-slate-400">From</p>
                  <p className="text-lg font-extrabold text-brand-700">{bdt(t.basePrice)}</p>
                </div>
                <Btn href={`/tours/${t.slug}`} size="sm">View</Btn>
              </CardFooter>
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
            <Card key={h.id} className="flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-pop">
              <div className="relative h-36 overflow-hidden bg-gradient-to-br from-brand-100 to-sky-100">
                {h.images?.[0] && (
                  <img
                    src={h.images[0]}
                    alt={h.name}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{h.name}</CardTitle>
                  {h.featured && <Badge tone="amber"><Star className="h-3 w-3" /> Featured</Badge>}
                </div>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {h.city} · {"★".repeat(h.stars ?? 3)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-1 text-sm text-slate-500">{(h.amenities ?? []).join(" · ")}</p>
              </CardContent>
              <CardFooter>
                <Btn
                  href={`/hotels/${h.slug}?checkIn=${today}&checkOut=${tomorrow}`}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  View rooms
                </Btn>
              </CardFooter>
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
          <Card key={o.id} className="border-gold-300 bg-gradient-to-br from-gold-100 to-white">
            <CardHeader className="pb-2">
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-gold-700 uppercase">
                <Tag className="h-3.5 w-3.5" /> Limited time
              </p>
              <CardTitle className="text-base">{o.title}</CardTitle>
            </CardHeader>
            {o.validTo && (
              <CardContent>
                <p className="text-xs text-slate-500">
                  Valid until {new Date(o.validTo).toLocaleDateString()}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
