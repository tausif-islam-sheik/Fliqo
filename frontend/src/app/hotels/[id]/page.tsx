"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BedDouble, Loader2, MapPin, Minus, Plus, Star } from "lucide-react";
import { api } from "@/lib/api/client";
import {
  Alert,
  Badge,
  bdt,
  Btn,
  Card,
  Container,
  Field,
  LoadingState,
  PageHeader,
  inputCls
} from "@/components/ui";

export default function HotelDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const dates = useSearchParams();
  const router = useRouter();
  const { data: hotel } = useQuery({ queryKey: ["hotel", id], queryFn: () => api<any>(`/hotels/${id}`) });
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function book() {
    setError(null);
    setBusy(true);
    const rooms = Object.entries(qty)
      .filter(([, q]) => q > 0)
      .map(([roomId, q]) => ({ roomId, qty: q }));
    try {
      const b = await api<any>("/hotels/book", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          hotelId: hotel.id,
          checkIn: dates.get("checkIn"),
          checkOut: dates.get("checkOut"),
          rooms,
          contactEmail: email,
          contactPhone: phone
        })
      });
      router.push(`/payment/success?ref=${b.bookingRef}&kind=hotel`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (!hotel)
    return (
      <Container className="py-12">
        <LoadingState label="Loading hotel…" />
      </Container>
    );

  const rooms = hotel.rooms ?? [];
  const selected = rooms.reduce((n: number, r: any) => n + (qty[r.id] ?? 0), 0);
  const total = rooms.reduce((s: number, r: any) => s + Number(r.price) * (qty[r.id] ?? 0), 0);

  return (
    <Container className="max-w-4xl py-8">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to results
      </button>
      <div className="gloss mt-3 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-blue-800 to-blue-500 p-6 text-white ring-1 ring-white/20 ring-inset sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{hotel.name}</h1>
          {hotel.featured && <Badge tone="amber"><Star className="h-3 w-3" /> Featured</Badge>}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-brand-100">
          <span className="text-gold-400">{"★".repeat(hotel.stars)}</span>
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {hotel.city}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(hotel.amenities ?? []).map((a: string) => (
            <span key={a} className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold ring-1 ring-white/20 ring-inset">
              {a}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          <PageHeader title="Choose rooms" subtitle={`${dates.get("checkIn") ?? ""} → ${dates.get("checkOut") ?? ""}`} />
          <div className="grid gap-3">
            {rooms.map((r: any) => (
              <Card key={r.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <BedDouble className="h-5 w-5" />
                </span>
                <div className="min-w-40 flex-1">
                  <p className="font-extrabold text-slate-900">{r.name}</p>
                  <p className="text-sm text-slate-500">{bdt(r.price)} <span className="text-xs">/ night</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Fewer ${r.name}`}
                    onClick={() => setQty((q) => ({ ...q, [r.id]: Math.max(0, (q[r.id] ?? 0) - 1) }))}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-brand-400 hover:text-brand-700"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-extrabold" aria-live="polite">{qty[r.id] ?? 0}</span>
                  <button
                    type="button"
                    aria-label={`More ${r.name}`}
                    onClick={() => setQty((q) => ({ ...q, [r.id]: Math.min(5, (q[r.id] ?? 0) + 1) }))}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-brand-400 hover:text-brand-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
            {rooms.length === 0 && <Alert tone="amber">No rooms listed for this hotel.</Alert>}
          </div>
        </div>

        <div>
          <Card className="p-5 lg:sticky lg:top-32">
            <p className="font-extrabold text-slate-900">Your booking</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Rooms selected</span><b>{selected}</b></div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-500">Total / night</span>
                <b className="text-lg text-brand-700">{bdt(total)}</b>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <Field label="Contact email">
                <input placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Contact phone">
                <input placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
              </Field>
            </div>
            {error && <div className="mt-3"><Alert tone="red">{error}</Alert></div>}
            <Btn onClick={book} disabled={busy || selected === 0} className="mt-4 w-full" size="lg">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Booking…" : selected === 0 ? "Select rooms first" : `Book hotel · ${bdt(total)}`}
            </Btn>
          </Card>
        </div>
      </div>
    </Container>
  );
}
