"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileSearch, Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { Alert, Card, Container, LoadingState, PageHeader, StatusBadge, inputCls } from "@/components/ui";

function Track() {
  const params = useSearchParams();
  const [ref, setRef] = useState(params.get("ref") ?? "");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function lookup() {
    setError(null);
    setBusy(true);
    try {
      setResult(await api(`/visa/track/${ref}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container className="max-w-2xl py-10">
      <PageHeader eyebrow="Visa" title="Track visa application" subtitle="Live status straight from our visa desk." />
      <Card className="p-5 sm:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookup();
          }}
          className="flex gap-2"
        >
          <input
            placeholder="Booking ref (VQ…)"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            aria-label="Booking reference"
            className={inputCls}
          />
          <button
            type="submit"
            disabled={busy || !ref}
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
            Track
          </button>
        </form>
        {error && <div className="mt-3"><Alert tone="red">{error}</Alert></div>}
        {result && (
          <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Booking ref</span>
              <b className="font-mono">{result.bookingRef}</b>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Status</span>
              <StatusBadge status={result.status} />
            </div>
            {result.visa && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Visa</span>
                <b>{result.visa.country} · {result.visa.visaType}</b>
              </div>
            )}
          </div>
        )}
      </Card>
    </Container>
  );
}

export default function VisaTrackPage() {
  return (
    <Suspense fallback={<Container className="py-8"><LoadingState /></Container>}>
      <Track />
    </Suspense>
  );
}
