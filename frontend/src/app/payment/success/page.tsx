"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Ticket } from "lucide-react";
import { useBooking } from "@/lib/query/bookings";
import { Alert, bdt, Btn, Card, Container, LoadingState, StatusBadge } from "@/components/ui";

function Success() {
  const ref = useSearchParams().get("ref");
  const { data, isLoading } = useBooking(ref, true);

  if (!ref)
    return (
      <Container className="max-w-xl py-12">
        <Alert tone="amber">Missing booking reference.</Alert>
      </Container>
    );
  if (isLoading || !data)
    return (
      <Container className="max-w-xl py-12">
        <Card className="p-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
          <p className="mt-3 font-extrabold text-slate-900">Confirming payment…</p>
          <p className="mt-1 text-sm text-slate-500">Talking to the payment gateway. Don&apos;t close this page.</p>
        </Card>
      </Container>
    );

  if (data.status === "PENDING_PAYMENT" || data.status === "PAID" || data.status === "TICKETING") {
    return (
      <Container className="max-w-xl py-12">
        <Card className="p-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
          <p className="mt-3 font-extrabold text-slate-900">Payment received — issuing ticket…</p>
          <p className="mt-2"><StatusBadge status={data.status} /></p>
        </Card>
      </Container>
    );
  }
  if (data.status !== "CONFIRMED") {
    return (
      <Container className="max-w-xl py-12">
        <Alert tone="red">
          Booking {data.status}. Ref: {ref} — <a href="/payment/fail" className="font-bold underline">details</a>
        </Alert>
      </Container>
    );
  }
  return (
    <Container className="max-w-xl py-10">
      <Card className="overflow-hidden text-center">
        <div className="gloss bg-gradient-to-br from-brand-600 via-brand-800 to-brand-950 px-6 py-8 text-white ring-1 ring-white/20 ring-inset">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
          <h1 className="mt-2 text-2xl font-black">Payment successful</h1>
          <p className="mt-1 text-sm text-brand-100">Your e-ticket is ready below.</p>
        </div>
        <div className="space-y-3 p-6 text-left">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-500">Booking ref</span>
            <b className="font-mono">{data.bookingRef}</b>
          </div>
          {data.flight && (
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
              <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <div>
                <p>E-ticket: <b>{data.flight.ticketNumbers.join(", ") || "—"}</b></p>
                <p className="text-slate-500">PNR {data.flight.pnr ?? "—"}</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-3 text-sm">
            <span className="font-semibold text-brand-800">Paid</span>
            <b className="text-lg text-brand-700">{bdt(data.totalAmount)} {data.currency}</b>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Btn href="/account" className="flex-1">View my bookings</Btn>
            <Btn href="/" variant="outline" className="flex-1">Book another trip</Btn>
          </div>
        </div>
      </Card>
    </Container>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<Container className="py-12"><LoadingState /></Container>}>
      <Success />
    </Suspense>
  );
}
