"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFares } from "@/lib/query/flights";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function monthKey(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

function fmtFare(v: number | null | undefined) {
  if (v == null) return "";
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${Math.round(v)}`;
}

function monthDiff(fromIso: string, toIso: string) {
  const [fy, fm] = fromIso.split("-").map(Number);
  const [ty, tm] = toIso.split("-").map(Number);
  return ty * 12 + tm - (fy * 12 + fm);
}

export function FareCalendar({
  from,
  to,
  value,
  minDate,
  onSelect,
  title
}: {
  from: string;
  to: string;
  value: string;
  minDate?: string;
  onSelect: (iso: string) => void;
  title: string;
}) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const floor = minDate ?? todayIso;
  const now = new Date();
  const [offset, setOffset] = useState(() =>
    Math.max(0, monthDiff(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, value.slice(0, 7)))
  );

  const months = useMemo(() => {
    const base = now.getFullYear() * 12 + now.getMonth() + offset;
    return [0, 1].map((i) => {
      const t = base + i;
      return { y: Math.floor(t / 12), m: t % 12 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  const faresA = useFares(from, to, monthKey(months[0].y, months[0].m));
  const faresB = useFares(from, to, monthKey(months[1].y, months[1].m));
  const fareMap = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const f of [...(faresA.data ?? []), ...(faresB.data ?? [])]) map.set(f.date, f.minPrice);
    return map;
  }, [faresA.data, faresB.data]);

  const overallMin = useMemo(() => {
    const vals = [...fareMap.values()].filter((v): v is number => v != null);
    return vals.length ? Math.min(...vals) : null;
  }, [fareMap]);

  function renderMonth(y: number, m: number) {
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const leadBlanks = new Date(y, m, 1).getDay();
    const monthFares = [...fareMap.entries()]
      .filter(([d]) => d.startsWith(monthKey(y, m)))
      .map(([, v]) => v)
      .filter((v): v is number => v != null);
    const monthMin = monthFares.length ? Math.min(...monthFares) : null;
    const label = new Date(y, m, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

    return (
      <div key={`${y}-${m}`}>
        <p className="text-center text-lg text-slate-500">{label}</p>
        <div className="mt-2 grid grid-cols-7 text-center">
          {WEEKDAYS.map((d) => (
            <span key={d} className="py-1 text-xs text-slate-400">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 border-t border-dashed border-slate-200 text-center">
          {Array.from({ length: leadBlanks }).map((_, i) => (
            <span key={`b${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const iso = `${monthKey(y, m)}-${String(i + 1).padStart(2, "0")}`;
            const fare = fareMap.get(iso);
            const disabled = iso < floor;
            const selected = iso === value;
            const cheapest = !selected && fare != null && fare === monthMin;
            return (
              <button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(iso)}
                className={cn(
                  "flex cursor-pointer flex-col items-center rounded-lg px-0.5 py-1.5 transition",
                  selected
                    ? "bg-brand-950 text-white shadow-card"
                    : disabled
                      ? "cursor-not-allowed text-slate-300"
                      : "text-slate-700 hover:bg-brand-50"
                )}
              >
                <span className="text-sm font-bold">{i + 1}</span>
                <span
                  className={cn(
                    "h-4 text-[11px] leading-4",
                    selected ? "text-white" : fare == null ? "text-transparent" : cheapest ? "font-bold text-emerald-600" : "text-slate-500"
                  )}
                >
                  {fmtFare(fare) || "·"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-center text-lg font-extrabold text-slate-600">{title}</p>
      <div className="mt-1 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          disabled={offset <= 0}
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next month"
          disabled={offset >= 11}
          onClick={() => setOffset((o) => Math.min(11, o + 1))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-brand-800 transition hover:bg-slate-100 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {months.map(({ y, m }) => renderMonth(y, m))}
      </div>
      <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
        <p className="text-sm text-teal-600">Fare is indicative</p>
        <p className="text-right text-sm text-slate-500">
          From{" "}
          <b className="text-base text-slate-900">
            {overallMin != null ? `BDT ${overallMin.toLocaleString("en-IN")}` : "…"}
          </b>
          <br />
          <span className="text-xs">Per Adult</span>
        </p>
      </div>
    </div>
  );
}
