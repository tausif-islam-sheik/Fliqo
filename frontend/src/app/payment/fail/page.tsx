"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, XCircle } from "lucide-react";
import { useBooking } from "@/lib/query/bookings";
import { Btn, Card, Container, StatusBadge } from "@/components/ui";

function Fail() {
  const ref = useSearchParams().get("ref");
  const { data } = useBooking(ref, false);
  return (
    <Container className="max-w-xl py-10">
      <Card className="p-8 text-center sm:p-10">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900">Payment failed</h1>
        <p className="mt-2 text-sm text-slate-500">
          {ref ? <>Booking <b className="font-mono text-slate-700">{ref}</b></> : "No booking reference."}{" "}
          {data && <><StatusBadge status={data.status} /></>}
        </p>
        <p className="mx-auto mt-3 max-w-sm text-sm text-slate-500">
          Your seat hold may still be active — try again before it expires. Nothing was charged.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Btn href="/">
            <Search className="h-4 w-4" /> Search again
          </Btn>
          {ref && <Btn href={`/payment/success?ref=${ref}`} variant="outline">Check status</Btn>}
        </div>
      </Card>
    </Container>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<Container className="py-12"><div /></Container>}>
      <Fail />
    </Suspense>
  );
}
