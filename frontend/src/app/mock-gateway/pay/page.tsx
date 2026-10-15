"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Loader2, Lock, XCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import { Alert, bdt, Card, Container, LoadingState } from "@/components/ui";

function MockPay() {
  const params = useSearchParams();
  const router = useRouter();
  const txn = params.get("txn") ?? "";
  const [busy, setBusy] = useState<"pay" | "fail" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["mock-session", txn],
    enabled: !!txn,
    queryFn: () => api<{ amount: number; gateway: string; status: string }>(`/payments/session?txn=${txn}`)
  });

  async function pay(success: boolean) {
    setError(null);
    setBusy(success ? "pay" : "fail");
    try {
      // Simulates the gateway: server-to-server IPN first, then user redirect.
      const res = await api<{ status: string; bookingRef: string }>("/payments/ipn", {
        method: "POST",
        body: JSON.stringify({ gatewayTxnId: txn, success })
      });
      router.push(success ? `/payment/success?ref=${res.bookingRef}` : `/payment/fail?ref=${res.bookingRef}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  if (!txn)
    return (
      <Container className="max-w-md py-12">
        <Alert tone="amber">Missing transaction.</Alert>
      </Container>
    );

  return (
    <Container className="max-w-md py-12">
      <Card className="overflow-hidden">
        <div className="bg-brand-950 px-6 py-5 text-white">
          <p className="flex items-center gap-2 text-lg font-black">
            <CreditCard className="h-5 w-5 text-gold-400" /> Mock SSLCommerz
          </p>
          <p className="mt-0.5 text-xs text-brand-200">Sandbox stand-in — no real money moves.</p>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap gap-1.5">
            {["Card", "bKash", "Nagad", "Bank"].map((m) => (
              <span key={m} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                {m}
              </span>
            ))}
          </div>
          {isLoading ? (
            <LoadingState label="Loading session…" />
          ) : (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">Amount due</span>
              <b className="text-xl text-brand-700">{bdt(data?.amount ?? 0)}</b>
            </div>
          )}
          {error && <Alert tone="red">{error}</Alert>}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => pay(true)}
              disabled={busy !== null}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {busy === "pay" && <Loader2 className="h-4 w-4 animate-spin" />}
              Pay now
            </button>
            <button
              onClick={() => pay(false)}
              disabled={busy !== null}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 py-3 text-sm font-extrabold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
            >
              {busy === "fail" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Fail payment
            </button>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Lock className="h-3.5 w-3.5" /> Secure checkout · no fee added at this step
          </p>
        </div>
      </Card>
    </Container>
  );
}

export default function MockPayPage() {
  return (
    <Suspense fallback={<Container className="py-12"><LoadingState /></Container>}>
      <MockPay />
    </Suspense>
  );
}
