"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, btnCls, Field, LoadingState, inputCls } from "@/components/ui";

function Accept() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await api("/staff/accept", { method: "POST", body: JSON.stringify({ token, password }) });
      router.push("/login");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Accept staff invite" subtitle="Set your password to activate your staff account.">
      <Field label="Password" hint="Minimum 8 characters">
        <div className="relative">
          <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            placeholder="Set password (min 8)"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputCls} pl-10`}
          />
        </div>
      </Field>
      {error && (
        <div className="mt-3">
          <Alert tone="red">{error}</Alert>
        </div>
      )}
      <button onClick={submit} disabled={password.length < 8 || busy} className={btnCls("primary", "lg", "mt-4 w-full")}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy ? "Activating…" : "Activate account"}
      </button>
    </AuthShell>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<main className="p-8"><LoadingState /></main>}>
      <Accept />
    </Suspense>
  );
}
