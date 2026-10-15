"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Check, Loader2, MapPin, Users } from "lucide-react";
import { useTour } from "@/lib/query/catalog";
import { api } from "@/lib/api/client";
import {
  Alert,
  Badge,
  bdt,
  Btn,
  Card,
  Container,
  cx,
  Field,
  LoadingState,
  inputCls
} from "@/components/ui";

export default function TourDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: tour } = useTour(slug ?? null);
  const [dep, setDep] = useState("");
  const [pax, setPax] = useState(2);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function book() {
    setError(null);
    setBusy(true);
    try {
      const b = await api<any>("/tours/book", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ departureId: dep, paxCount: pax, contactEmail: email, contactPhone: phone })
      });
      router.push(`/payment/success?ref=${b.bookingRef}&kind=tour`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (!tour)
    return (
      <Container className="py-12">
        <LoadingState label="Loading tour…" />
      </Container>
    );

  const departures = tour.departures ?? [];
  const chosen = departures.find((d: any) => d.id === dep);

  return (
    <Container className="max-w-4xl py-8">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All tours
      </button>

      <div className="relative mt-3 overflow-hidden rounded-lg bg-gradient-to-br from-brand-800 via-blue-800 to-blue-500 p-6 text-white ring-1 ring-white/20 ring-inset sm:p-8">
        {tour.images?.[0] && (
          <img
            src={tour.images[0]}
            alt={tour.title}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-brand-950/30 to-transparent" />
        <div className="relative text-shadow-hero">
        <p className="flex items-center gap-1.5 text-sm font-bold text-brand-100">
          <MapPin className="h-4 w-4" /> {tour.destination}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{tour.title}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-brand-100">
          <CalendarDays className="h-4 w-4" /> {tour.durationDays} days
        </p>
        {(tour.inclusions ?? []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tour.inclusions.map((inc: string) => (
              <span key={inc} className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold ring-1 ring-white/20 ring-inset">
                <Check className="h-3 w-3" /> {inc}
              </span>
            ))}
          </div>
        )}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="font-extrabold text-slate-900">Itinerary</h2>
          <Card className="mt-2 space-y-3 p-5">
            {Array.isArray((tour.itinerary as any)?.days) ? (
              (tour.itinerary as any).days.map((d: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-black text-white">
                    {d.d ?? i + 1}
                  </span>
                  <p className="pt-0.5 text-sm text-slate-600">{d.plan}</p>
                </div>
              ))
            ) : (
              <pre className="scroll-slim overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                {JSON.stringify(tour.itinerary, null, 2)}
              </pre>
            )}
          </Card>

          <h2 className="mt-6 font-extrabold text-slate-900">Select departure</h2>
          <div className="mt-2 grid gap-2">
            {departures.map((d: any) => {
              const full = d.seatsLeft <= 0;
              return (
                <label
                  key={d.id}
                  className={cx(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition",
                    dep === d.id
                      ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
                      : "border-slate-200 bg-white hover:border-brand-300",
                    full && "cursor-not-allowed opacity-60"
                  )}
                >
                  <input
                    type="radio"
                    name="dep"
                    checked={dep === d.id}
                    onChange={() => setDep(d.id)}
                    disabled={full}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <span className="flex-1 text-sm font-semibold text-slate-800">
                    {new Date(d.startDate).toLocaleDateString()}
                  </span>
                  {full ? <Badge tone="red">Sold out</Badge> : <Badge tone="green">{d.seatsLeft}/{d.seatsTotal} seats</Badge>}
                  <b className="text-brand-700">{bdt(d.price)}</b>
                </label>
              );
            })}
            {departures.length === 0 && <Alert tone="amber">No departures scheduled yet.</Alert>}
          </div>
        </div>

        <div>
          <Card className="p-5 lg:sticky lg:top-32">
            <p className="font-extrabold text-slate-900">Book this tour</p>
            {chosen && (
              <p className="mt-1 text-sm text-slate-500">
                {new Date(chosen.startDate).toLocaleDateString()} · <b className="text-brand-700">{bdt(Number(chosen.price) * pax)}</b> total
              </p>
            )}
            <div className="mt-3 grid gap-3">
              <Field label="Travelers">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <input type="number" min={1} value={pax} onChange={(e) => setPax(Number(e.target.value))} aria-label="Travelers" className={inputCls} />
                </div>
              </Field>
              <Field label="Contact email">
                <input placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Contact phone">
                <input placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
              </Field>
            </div>
            {error && <div className="mt-3"><Alert tone="red">{error}</Alert></div>}
            <Btn onClick={book} disabled={!dep || busy} size="lg" className="mt-4 w-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Booking…" : "Book tour"}
            </Btn>
          </Card>
        </div>
      </div>
    </Container>
  );
}
