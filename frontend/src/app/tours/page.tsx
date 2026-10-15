"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { useTours } from "@/lib/query/catalog";
import { bdt, Btn, Card, Container, EmptyState, LoadingState, PageHeader } from "@/components/ui";

export default function ToursPage() {
  const router = useRouter();
  const { data, isLoading } = useTours();
  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Tours"
        title="Tour packages"
        subtitle="Fixed departures, confirmed seats, local expert guides."
      />
      {isLoading && <LoadingState label="Loading tours…" />}
      {!isLoading && (data ?? []).length === 0 && (
        <EmptyState title="No tours right now" hint="New departures are added every week — check back soon." />
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((t: any) => (
          <Card key={t.id} className="flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-pop">
            <div className="relative flex h-32 items-end overflow-hidden bg-gradient-to-br from-brand-800 via-blue-700 to-sky-400 p-4">
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
              <div className="relative text-shadow-hero">
                <p className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <MapPin className="h-4 w-4" /> {t.destination}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-brand-100">
                  <CalendarDays className="h-3.5 w-3.5" /> {t.durationDays} days · {t.departures?.length ?? 0} departures
                </p>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="font-extrabold text-slate-900">{t.title}</p>
              <div className="mt-3 flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-xs text-slate-400">From</p>
                  <p className="text-lg font-extrabold text-brand-700">{bdt(t.basePrice)}</p>
                </div>
                <Btn size="sm" onClick={() => router.push(`/tours/${t.slug}`)}>
                  View itinerary <ArrowRight className="h-3.5 w-3.5" />
                </Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Container>
  );
}
