"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { api, setAccessToken } from "@/lib/api/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, btnCls, LoadingState } from "@/components/ui";

function TwoFAForm() {
  const userId = useSearchParams().get("userId") ?? "";
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const res = await api<{ accessToken: string }>("/auth/verify-2fa", {
        method: "POST",
        body: JSON.stringify({ userId, code })
      });
      setAccessToken(res.accessToken);
      router.push("/admin");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Staff verification" subtitle="Enter the 6-digit code emailed to you.">
      <div className="flex items-center gap-3 rounded-lg bg-slate-100 p-3 text-sm text-slate-600">
        <ShieldCheck className="h-5 w-5 shrink-0 text-brand-600" />
        This extra step protects staff accounts.
      </div>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        aria-label="Two-factor code"
        className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-2xl font-extrabold tracking-[0.5em] text-slate-900 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none"
      />
      {error && (
        <div className="mt-3">
          <Alert tone="red">{error}</Alert>
        </div>
      )}
      <button onClick={submit} disabled={busy || code.length !== 6} className={btnCls("primary", "lg", "mt-4 w-full")}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy ? "Verifying…" : "Verify"}
      </button>
    </AuthShell>
  );
}

export default function TwoFAPage() {
  return (
    <Suspense fallback={<main className="p-8"><LoadingState /></main>}>
      <TwoFAForm />
    </Suspense>
  );
}
