/**
 * Fliqo UI kit — shadcn-based primitives.
 *
 * This module re-exports the shadcn component library (`./ui/*`) with
 * Fliqo-flavoured convenience wrappers (Btn, Card, Field, StatusBadge, …)
 * so every page shares one consistent design system.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card as ShadcnCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table as ShadcnTable,
  TableBody,
  TableCell as ShadcnCell,
  TableHead as ShadcnHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

export { cn };
export function cx(...parts: Array<string | false | null | undefined>) {
  return cn(parts.filter(Boolean).join(" "));
}

/* ---------------------------------- layout --------------------------------- */

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold tracking-[0.18em] text-brand-600 uppercase">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHead({
  eyebrow,
  title,
  subtitle,
  action
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold tracking-[0.18em] text-brand-600 uppercase">{eyebrow}</p>
        )}
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ----------------------------------- card ---------------------------------- */

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <ShadcnCard className={className}>{children}</ShadcnCard>;
}

export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle };

/* ---------------------------------- buttons --------------------------------- */

type BtnVariant = "primary" | "accent" | "outline" | "ghost" | "danger" | "dark";
type BtnSize = "sm" | "md" | "lg";

const btnVariantMap: Record<BtnVariant, "default" | "accent" | "outline" | "ghost" | "destructive" | "secondary"> = {
  primary: "default",
  accent: "accent",
  outline: "outline",
  ghost: "ghost",
  danger: "destructive",
  dark: "secondary"
};

const btnSizeMap: Record<BtnSize, "sm" | "md" | "lg"> = { sm: "sm", md: "md", lg: "lg" };

export function btnCls(variant: BtnVariant = "primary", size: BtnSize = "md", extra?: string) {
  return buttonVariants({ variant: btnVariantMap[variant], size: btnSizeMap[size], className: extra });
}

export function Btn({
  href,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: {
  href?: string;
  variant?: BtnVariant;
  size?: BtnSize;
  className?: string;
} & (
  | ({ href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className">)
  | ({ href?: undefined } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">)
)) {
  if (href) {
    const aProps = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <Button asChild variant={btnVariantMap[variant]} size={btnSizeMap[size]} className={className}>
        <Link href={href} {...aProps}>
          {aProps.children}
        </Link>
      </Button>
    );
  }
  return (
    <Button
      variant={btnVariantMap[variant]}
      size={btnSizeMap[size]}
      className={className}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    />
  );
}

export { Button, buttonVariants };
export { Calendar } from "./ui/calendar";
export { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
export { DatePicker, toISODate, parseISODate, formatISODate } from "./ui/date-picker";

/* ----------------------------------- forms ---------------------------------- */

export const inputCls =
  "flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export const selectCls =
  "flex h-11 w-full cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export const textareaCls =
  "flex min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export const checkCls =
  "h-4 w-4 cursor-pointer rounded border-slate-300 accent-brand-600";

export function Field({
  label,
  children,
  hint,
  error,
  className
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("block", className)}>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </div>
  );
}

export { Input, Label };

/* ---------------------------------- badges ---------------------------------- */

type Tone = "green" | "amber" | "red" | "blue" | "slate" | "purple";

const toneVariantMap: Record<Tone, "success" | "warning" | "destructive" | "info" | "secondary" | "purple"> = {
  green: "success",
  amber: "warning",
  red: "destructive",
  blue: "info",
  slate: "secondary",
  purple: "purple"
};

export function Badge({ tone = "slate", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <ShadcnBadge variant={toneVariantMap[tone]} className={className}>
      {children}
    </ShadcnBadge>
  );
}

const STATUS_TONE: Array<[RegExp, Tone]> = [
  [/^(CONFIRMED|PAID|SUCCESS|COMPLETED|ACTIVE|VERIFIED|SENT|DELIVERED|APPROVED)$/i, "green"],
  [/^(PENDING|PENDING_PAYMENT|TICKETING|DRAFT|QUEUED|SCHEDULED|SENDING|RUNNING|REQUESTED)$/i, "amber"],
  [/^(FAILED|PAYMENT_FAILED|TICKETING_FAILED|CANCELLED|EXPIRED|BOUNCED|REJECTED|SUSPENDED)$/i, "red"],
  [/^(REFUNDED|COMPLETED|OPENED|CLICKED)$/i, "blue"],
  [/^(PAUSED|REVOKED|UNSUBSCRIBED|COMPLAINED)$/i, "purple"]
];

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE.find(([re]) => re.test(status))?.[1] ?? "slate";
  return <Badge tone={tone}>{status.replace(/_/g, " ")}</Badge>;
}

/* ---------------------------------- states ---------------------------------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-label="Loading"
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600",
        className
      )}
    />
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Spinner /> {label}
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-base font-bold text-slate-700">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Alert({ tone = "amber", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        tone === "red" && "border-red-200 bg-red-50 text-red-800",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-900",
        tone === "green" && "border-emerald-200 bg-emerald-50 text-emerald-900",
        tone === "blue" && "border-sky-200 bg-sky-50 text-sky-900",
        tone === "slate" && "border-slate-200 bg-slate-50 text-slate-700",
        tone === "purple" && "border-violet-200 bg-violet-50 text-violet-900"
      )}
    >
      {children}
    </div>
  );
}

/* ---------------------------------- stats ----------------------------------- */

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <ShadcnCard className="p-4">
      <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </ShadcnCard>
  );
}

/* ---------------------------------- tables ---------------------------------- */

export function TableShell({ children }: { children: ReactNode }) {
  return <ShadcnTable>{children}</ShadcnTable>;
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <ShadcnHead className={className}>{children}</ShadcnHead>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <ShadcnCell className={className}>{children}</ShadcnCell>;
}

export { Skeleton, TableBody, TableHeader, TableRow };

/* -------------------------------- money fmt --------------------------------- */

export function bdt(n: number | string) {
  const v = typeof n === "string" ? Number(n) : n;
  return `৳${Number(v).toLocaleString("en-IN")}`;
}
