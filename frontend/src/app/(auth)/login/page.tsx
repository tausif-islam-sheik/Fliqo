"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@fliqo/validation";
import { Loader2, LogIn } from "lucide-react";
import { api, setAccessToken } from "@/lib/api/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, btnCls, Field, inputCls } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const { register, handleSubmit, formState } = form;

  async function onSubmit(values: LoginInput) {
    setError(null);
    try {
      const res = await api<{ needsVerification?: boolean; needs2FA?: boolean; userId?: string; accessToken?: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(values)
      });
      if (res.needsVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
        return;
      }
      if (res.needs2FA) {
        router.push(`/2fa?userId=${res.userId}`);
        return;
      }
      if (res.accessToken) setAccessToken(res.accessToken);
      router.push("/account");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to manage bookings, travelers and deals."
      footer={
        <>
          No account?{" "}
          <a href="/signup" className="font-bold text-brand-700 hover:underline">
            Sign up
          </a>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <Field label="Email" error={formState.errors.email?.message}>
          <input placeholder="you@example.com" type="email" autoComplete="email" {...register("email")} className={inputCls} />
        </Field>
        <Field label="Password" error={formState.errors.password?.message}>
          <input placeholder="••••••••" type="password" autoComplete="current-password" {...register("password")} className={inputCls} />
        </Field>
        {error && <Alert tone="red">{error}</Alert>}
        <button type="submit" disabled={formState.isSubmitting} className={btnCls("primary", "lg", "w-full")}>
          {formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {formState.isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
