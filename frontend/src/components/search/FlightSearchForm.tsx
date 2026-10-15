"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { DatePicker, btnCls } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const AIRPORTS = [
  { code: "DAC", name: "Dhaka" },
  { code: "CGP", name: "Chittagong" },
  { code: "CXB", name: "Cox's Bazar" }
];

export function FlightSearchForm({ initial }: { initial?: { from?: string; to?: string; date?: string; adt?: number } }) {
  const router = useRouter();
  const [from, setFrom] = useState(initial?.from ?? "DAC");
  const [to, setTo] = useState(initial?.to ?? "CXB");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [adt, setAdt] = useState(initial?.adt ?? 1);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams({ from, to, date, adt: String(adt) });
    router.push(`/flights/search?${q.toString()}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
      <div>
        <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500 uppercase">From</span>
        <Select value={from} onValueChange={setFrom}>
          <SelectTrigger aria-label="From">
            <SelectValue placeholder="From" />
          </SelectTrigger>
          <SelectContent>
            {AIRPORTS.map((a) => (
              <SelectItem key={a.code} value={a.code}>
                {a.code} — {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500 uppercase">To</span>
        <Select value={to} onValueChange={setTo}>
          <SelectTrigger aria-label="To">
            <SelectValue placeholder="To" />
          </SelectTrigger>
          <SelectContent>
            {AIRPORTS.map((a) => (
              <SelectItem key={a.code} value={a.code}>
                {a.code} — {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="block">
        <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500 uppercase">Date</span>
        <DatePicker value={date} onChange={setDate} min={new Date().toISOString().slice(0, 10)} ariaLabel="Date" />
      </div>
      <div>
        <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500 uppercase">Passengers</span>
        <Select value={String(adt)} onValueChange={(v) => setAdt(Number(v))}>
          <SelectTrigger aria-label="Passengers">
            <SelectValue placeholder="Passengers" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} adult{n > 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end sm:col-span-2 lg:col-span-1">
        <button type="submit" className={btnCls("accent", "lg", "w-full whitespace-nowrap")}>
          <Search className="h-4 w-4" /> Search flights
        </button>
      </div>
    </form>
  );
}
