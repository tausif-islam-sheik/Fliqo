import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="bg-gradient-to-b from-brand-50 to-slate-50 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-md px-4">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2" aria-label="Fliqo home">
          <span className="gloss flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 via-brand-600 to-brand-900 text-xl font-black text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]">
            F
          </span>
          <span className="text-2xl font-black tracking-tight text-brand-950">
            Fliqo<span className="text-gold-500">.</span>
          </span>
        </Link>
        <div className="mt-6 animate-fade-up rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-4 text-center text-sm text-slate-500">{footer}</div>}
      </div>
    </main>
  );
}
