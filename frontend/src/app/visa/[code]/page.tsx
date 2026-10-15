"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Clock, FileCheck, Loader2, Stamp } from "lucide-react";
import { useVisaCountry } from "@/lib/query/catalog";
import { api } from "@/lib/api/client";
import { Alert, bdt, Btn, Card, Container, Field, LoadingState, inputCls } from "@/components/ui";

export default function VisaCountryPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { data: c } = useVisaCountry(code ?? null);
  const [visaType, setVisaType] = useState("Tourist");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function apply() {
    setError(null);
    setBusy(true);
    try {
      const b = await api<any>("/visa/apply", {
        method: "POST",
        body: JSON.stringify({ country: code, visaType, documents: [], contactEmail: email, contactPhone: phone })
      });
      router.push(`/visa/track?ref=${b.bookingRef}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (!c)
    return (
      <Container className="py-12">
        <LoadingState label="Loading country…" />
      </Container>
    );

  const req = c.requirements as any;
  const docs: string[] = Array.isArray(req?.docs) ? req.docs : [];
  const notes: string | undefined = typeof req?.notes === "string" ? req.notes : undefined;

  return (
    <Container className="max-w-4xl py-8">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All countries
      </button>
      <div className="gloss mt-3 flex flex-wrap items-center gap-4 rounded-lg bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 text-white ring-1 ring-white/20 ring-inset sm:p-8">
        <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 ring-inset">
          <Stamp className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{c.name} visa</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-brand-100">
            <span className="text-xl font-black text-gold-400">{bdt(c.fee)}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> ~{c.processingDays} days</span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-extrabold text-slate-900">
            <FileCheck className="h-5 w-5 text-brand-600" /> Requirements
          </h2>
          {docs.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {docs.map((d: string) => (
                <li key={d} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {d}
                </li>
              ))}
            </ul>
          ) : (
            <pre className="scroll-slim mt-3 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              {JSON.stringify(c.requirements, null, 2)}
            </pre>
          )}
          {notes && <p className="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">{notes}</p>}
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-extrabold text-slate-900">Apply now</h2>
          <div className="mt-3 grid gap-3">
            <Field label="Visa type">
              <input placeholder="Tourist" value={visaType} onChange={(e) => setVisaType(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Contact email">
              <input placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Contact phone">
              <input placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </Field>
          </div>
          {error && <div className="mt-3"><Alert tone="red">{error}</Alert></div>}
          <Btn onClick={apply} disabled={busy} size="lg" className="mt-4 w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Submitting…" : "Submit application"}
          </Btn>
        </Card>
      </div>
    </Container>
  );
}
