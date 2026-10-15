"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, Lock, Plane, Ticket, Timer } from "lucide-react";
import { useReprice } from "@/lib/query/flights";
import { api } from "@/lib/api/client";
import {
  Alert,
  Badge,
  bdt,
  Btn,
  Card,
  Container,
  Field,
  inputCls,
  LoadingState,
  PageHeader
} from "@/components/ui";

function left(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function BookingForm() {
  const params = useSearchParams();
  const router = useRouter();
  const offerId = params.get("offer") ?? "";
  const adt = Number(params.get("adt") ?? 1);
  const { data: offer, isLoading, isError } = useReprice(offerId || null);

  const [passengers, setPassengers] = useState(() =>
    Array.from({ length: adt }, () => ({ firstName: "", lastName: "" }))
  );
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<any>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const total = useMemo(() => (offer ? offer.price * passengers.length : 0), [offer, passengers]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const booking = await api<any>("/bookings/flight", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ offerId, passengers, contactEmail: email, contactPhone: phone })
      });
      setDone(booking);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!offerId)
    return (
      <Container className="py-12">
        <Alert tone="amber">No offer selected.</Alert>
        <Btn href="/flights/search" variant="outline" className="mt-4">Back to search</Btn>
      </Container>
    );
  if (isLoading)
    return (
      <Container className="py-12">
        <LoadingState label="Checking live fare…" />
      </Container>
    );
  if (isError || !offer)
    return (
      <Container className="py-12">
        <Alert tone="red">Fare expired — prices change fast.</Alert>
        <button onClick={() => router.back()} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to results
        </button>
      </Container>
    );

  if (done) {
    const ms = new Date(done.expiresAt).getTime() - now;
    async function payNow() {
      setError(null);
      setBusy(true);
      try {
        const s = await api<{ redirectUrl: string }>("/payments/init", {
          method: "POST",
          headers: { "Idempotency-Key": crypto.randomUUID() },
          body: JSON.stringify({ bookingRef: done.bookingRef })
        });
        window.location.href = s.redirectUrl;
      } catch (err) {
        setError((err as Error).message);
        setBusy(false);
      }
    }
    return (
      <Container className="max-w-2xl py-10">
        <Card className="overflow-hidden text-center">
          <div className="gloss bg-gradient-to-br from-brand-600 via-brand-800 to-brand-950 px-6 py-8 text-white ring-1 ring-white/20 ring-inset">
            <Ticket className="mx-auto h-10 w-10 text-gold-400" />
            <h1 className="mt-2 text-2xl font-black">Seat held!</h1>
            <p className="mt-1 text-sm text-brand-100">Complete payment before the hold expires.</p>
          </div>
          <div className="space-y-3 p-6">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-500">Booking ref</span>
              <b className="font-mono text-slate-900">{done.bookingRef}</b>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3 text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-amber-800">
                <Timer className="h-4 w-4" /> Pay before hold expires
              </span>
              <b className="font-mono text-lg text-amber-900">{left(ms)}</b>
            </div>
            <p className="text-3xl font-black tracking-tight text-brand-700">{bdt(done.totalAmount)}</p>
            {error && <Alert tone="red">{error}</Alert>}
            <button onClick={payNow} disabled={busy} className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gold-400 px-6 py-3.5 text-base font-bold text-brand-950 transition hover:bg-gold-500 disabled:opacity-60">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
              {busy ? "Redirecting…" : "Pay now · card / bKash / Nagad"}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Lock className="h-3.5 w-3.5" /> Secure checkout · Easy cancellation · 24/7 support
            </p>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="max-w-3xl py-10">
      <PageHeader eyebrow="Checkout" title="Review & book" />
      <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 border-brand-200 bg-brand-50 p-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Plane className="h-5 w-5" />
        </span>
        <div>
          <p className="font-extrabold text-slate-900">
            {offer.airlineName} {offer.flightNo} · {offer.from} → {offer.to}
          </p>
          <p className="text-sm text-slate-600">
            Live fare <b>{bdt(offer.price)}</b> × {passengers.length} ={" "}
            <b className="text-brand-700">{bdt(total)}</b>
          </p>
        </div>
        <Badge tone="green" className="ml-auto">Live fare</Badge>
      </Card>

      <form onSubmit={submit} className="mt-5">
        <Card className="space-y-5 p-5 sm:p-6">
          {passengers.map((p, i) => (
            <fieldset key={i} className="rounded-lg border border-slate-200 p-4">
              <legend className="px-1 text-sm font-bold text-slate-700">Passenger {i + 1}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  placeholder="First name"
                  aria-label={`Passenger ${i + 1} first name`}
                  value={p.firstName}
                  onChange={(e) => setPassengers((all) => all.map((x, j) => (j === i ? { ...x, firstName: e.target.value } : x)))}
                  className={inputCls}
                  required
                />
                <input
                  placeholder="Last name"
                  aria-label={`Passenger ${i + 1} last name`}
                  value={p.lastName}
                  onChange={(e) => setPassengers((all) => all.map((x, j) => (j === i ? { ...x, lastName: e.target.value } : x)))}
                  className={inputCls}
                  required
                />
              </div>
            </fieldset>
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Contact email">
              <input placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
            </Field>
            <Field label="Contact phone">
              <input placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} required />
            </Field>
          </div>
          {error && <Alert tone="red">{error}</Alert>}
          <button type="submit" disabled={busy} className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3.5 text-base font-bold text-white transition hover:bg-brand-700 disabled:opacity-60">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
            {busy ? "Holding seat…" : `Hold seat · ${bdt(total)}`}
          </button>
          <p className="text-center text-xs text-slate-400">No payment taken yet — pay in the next step.</p>
        </Card>
      </form>
    </Container>
  );
}

export default function FlightBookingPage() {
  return (
    <Suspense fallback={<Container className="py-12"><LoadingState /></Container>}>
      <BookingForm />
    </Suspense>
  );
}
