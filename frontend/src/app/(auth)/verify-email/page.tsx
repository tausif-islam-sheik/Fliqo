"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { api, setAccessToken } from "@/lib/api/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, btnCls, LoadingState } from "@/components/ui";

function VerifyForm() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get("email") ?? "";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const res = await api<{ accessToken: string }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, code })
      });
      setAccessToken(res.accessToken);
      router.push("/account");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError(null);
    setResent(false);
    try {
      await api("/auth/resend-otp", { method: "POST", body: JSON.stringify({ email }) });
      setResent(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <AuthShell
      title="Verify email"
      subtitle={
        <>
          6-digit code sent to <b className="text-slate-700">{email || "your email"}</b>
        </>
      }
    >
      <div className="flex items-center gap-3 rounded-2xl bg-brand-50 p-3 text-sm text-brand-800">
        <MailCheck className="h-5 w-5 shrink-0" />
        Check your inbox — and Mailpit :8025 when running locally.
      </div>
      <input
        placeholder="123456"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="Verification code"
        className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-2xl font-extrabold tracking-[0.5em] text-slate-900 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none"
      />
      {error && (
        <div className="mt-3">
          <Alert tone="red">{error}</Alert>
        </div>
      )}
      {resent && (
        <div className="mt-3">
          <Alert tone="green">New code sent — check your inbox.</Alert>
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <button onClick={submit} disabled={busy || code.length !== 6} className={btnCls("primary", "lg", "flex-1")}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Verifying…" : "Verify"}
        </button>
        <button type="button" onClick={resend} className={btnCls("outline", "lg")}>
          Resend
        </button>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="p-8"><LoadingState /></main>}>
      <VerifyForm />
    </Suspense>
  );
}
