"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@fliqo/validation";
import { Loader2, UserPlus } from "lucide-react";
import { api } from "@/lib/api/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, btnCls, Field, inputCls } from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });
  const { register, handleSubmit, formState, control } = form;

  async function onSubmit(values: SignupInput) {
    setError(null);
    try {
      const res = await api<{ userId: string; devCode: string | null }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(values)
      });
      if (res.devCode) console.log("DEV OTP:", res.devCode);
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Email is verified with a 6-digit code. It takes a minute."
      footer={
        <>
          Have an account?{" "}
          <a href="/login" className="font-bold text-brand-700 hover:underline">
            Log in
          </a>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <Field label="Full name" error={formState.errors.name?.message}>
          <input placeholder="Your name" autoComplete="name" {...register("name")} className={inputCls} />
        </Field>
        <Field label="Email" error={formState.errors.email?.message}>
          <input placeholder="you@example.com" type="email" autoComplete="email" {...register("email")} className={inputCls} />
        </Field>
        <Field label="Password" hint="Minimum 8 characters" error={formState.errors.password?.message}>
          <input placeholder="Min 8 characters" type="password" autoComplete="new-password" {...register("password")} className={inputCls} />
        </Field>
        <Controller
          name="marketingOptIn"
          control={control}
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
              <Checkbox
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
                aria-label="Email me exclusive offers"
              />
              Email me exclusive offers
            </label>
          )}
        />
        {error && <Alert tone="red">{error}</Alert>}
        <button type="submit" disabled={formState.isSubmitting} className={btnCls("primary", "lg", "w-full")}>
          {formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {formState.isSubmitting ? "Creating…" : "Sign up"}
        </button>
      </form>
    </AuthShell>
  );
}
