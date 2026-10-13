"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Hotel,
  Minus,
  Palmtree,
  PlaneTakeoff,
  Plus,
  Search,
  Stamp,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAirports, type Airport } from "@/lib/query/flights";
import { FareCalendar } from "@/components/home/FareCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { btnCls } from "@/components/ui";

const TABS = [
  { id: "flights", label: "Flight", icon: PlaneTakeoff },
  { id: "hotels", label: "Hotel", icon: Hotel },
  { id: "tours", label: "Tour", icon: Palmtree },
  { id: "visa", label: "Visa", icon: Stamp }
] as const;

type TabId = (typeof TABS)[number]["id"];
type Trip = "oneway" | "round";

const STATIC_AIRPORTS = [
  { code: "DAC", city: "Dhaka", airport: "Hazrat Shahjalal International Airport" },
  { code: "CGP", city: "Chittagong", airport: "Shah Amanat International Airport" },
  { code: "CXB", city: "Cox's Bazar", airport: "Cox's Bazar Airport" },
  { code: "JSR", city: "Jessore", airport: "Jessore Airport" },
  { code: "SPD", city: "Saidpur", airport: "Saidpur Airport" },
  { code: "ZYL", city: "Sylhet", airport: "Osmani International Airport" }
];

const CITIES = ["Cox's Bazar", "Dhaka", "Chittagong", "Sylhet", "Bandarban"];
const GOLD_SEARCH =
  "gloss pointer-events-auto cursor-pointer rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-600 px-14 py-4 text-lg font-black whitespace-nowrap text-brand-950 shadow-[0_10px_24px_-8px_rgb(245_163_1/0.8),inset_0_1px_0_rgb(255_255_255/0.5)] transition hover:from-gold-200 hover:via-gold-400 hover:to-gold-600 disabled:opacity-60";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function plusDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDay(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { main: "Select date", sub: "" };
  return {
    main: `${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "short" })}'${String(d.getFullYear()).slice(2)}`,
    sub: d.toLocaleDateString("en-GB", { weekday: "long" })
  };
}

function countryName(code: string | null) {
  if (!code) return "";
  if (code === "BD") return "Bangladesh";
  return code;
}

function displayAirport(code: string) {
  return STATIC_AIRPORTS.find((a) => a.code === code) ?? { code, city: code, airport: "" };
}

/* ------------------------------- field boxes ------------------------------ */

function AirportPicker({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const current = displayAirport(value);
  const { data, isLoading, isError } = useAirports(debounced, open);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q, open]);

  const list: Airport[] = (data ?? []).map((a) => ({
    code: a.code,
    name: a.name,
    city: a.city ?? a.code,
    country: a.country
  }));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setQ("");
          setDebounced("");
          setOpen((v) => !v);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none"
      >
        <span className="block text-[11px] font-bold tracking-wider text-slate-500">{label}</span>
        <span className="mt-0.5 block truncate text-xl font-extrabold text-brand-950">{current.city}</span>
        <span className="block truncate text-xs text-slate-500">
          {current.code}, {current.airport}
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute z-30 mt-2 max-h-96 w-full min-w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
            <div className="flex items-center gap-2 border-b border-slate-100 p-3">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type to search"
                aria-label="Search airports"
                className="w-full text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="scroll-slim max-h-80 overflow-y-auto p-1.5">
              {isLoading && <p className="p-3 text-sm text-slate-400">Searching…</p>}
              {isError && <p className="p-3 text-sm text-red-600">Couldn&apos;t load airports.</p>}
              {!isLoading && !isError && list.length === 0 && (
                <p className="p-3 text-sm text-slate-400">No airports found.</p>
              )}
              {list.map((a) => (
                <button
                  key={a.code}
                  type="button"
                  role="option"
                  aria-selected={a.code === value}
                  onClick={() => {
                    onChange(a.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl p-2.5 text-left transition",
                    a.code === value ? "bg-brand-50" : "hover:bg-slate-50"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-brand-950">
                      {a.city}, {countryName(a.country)}
                    </span>
                    <span className="block truncate text-xs text-slate-500">{a.name}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-slate-400">{a.code}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DateBox({
  label,
  value,
  onChange,
  min,
  picker,
  onClear
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  picker?: (close: () => void, current: string) => React.ReactNode;
  onClear?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const f = value ? fmtDay(value) : { main: "Select date", sub: "" };

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-4 transition focus-within:border-brand-400">
      <p className="text-[11px] font-bold tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold text-brand-950">{f.main}</p>
      <p className="min-h-4 text-xs text-slate-500">{f.sub}</p>
      {onClear && value && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear ${label}`}
          className="absolute top-3 right-3 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-slate-200 text-slate-500 transition hover:bg-slate-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {picker ? (
        <>
          <button
            type="button"
            aria-label={label}
            onClick={() => setOpen((v) => !v)}
            className="absolute inset-0 cursor-pointer rounded-2xl focus:ring-2 focus:ring-brand-200 focus:outline-none"
          />
          {open && (
            <>
              <div className="fixed inset-0 z-20 cursor-default" onClick={close} />
              <div className="absolute top-full left-1/2 z-30 mt-2 w-[42rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-3xl border border-slate-200 bg-white p-4 shadow-pop sm:p-5">
                {picker(close, value)}
              </div>
            </>
          )}
        </>
      ) : (
        <input
          type="date"
          value={value}
          min={min}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          aria-label={label}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      )}
    </div>
  );
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
      <span>
        <span className="block text-sm font-bold text-slate-700">{label}</span>
        <span className="block text-xs text-slate-400">{hint}</span>
      </span>
      <span className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label={`Fewer ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-brand-900 transition hover:border-brand-500 disabled:opacity-30"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-5 text-center font-extrabold" aria-live="polite">{value}</span>
        <button
          type="button"
          aria-label={`More ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-brand-900 text-brand-900 transition hover:bg-brand-950 hover:text-white disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
        </button>
      </span>
    </div>
  );
}

function TravelerBox({
  adt,
  setAdt,
  chd,
  setChd,
  inf,
  setInf,
  cabin,
  setCabin
}: {
  adt: number;
  setAdt: (n: number) => void;
  chd: number;
  setChd: (n: number) => void;
  inf: number;
  setInf: (n: number) => void;
  cabin: string;
  setCabin: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const total = adt + chd + inf;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none"
      >
        <span className="block text-[11px] font-bold tracking-wider text-slate-500">TRAVELER, CLASS</span>
        <span className="mt-0.5 block text-xl font-extrabold text-brand-950">
          {total} Traveler{total > 1 ? "s" : ""}
        </span>
        <span className="block text-xs text-slate-500">{cabin}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-pop">
            <Stepper label="Adults" hint="12 years and above" value={adt} min={1} max={6} onChange={setAdt} />
            <Stepper label="Children" hint="2–11 years" value={chd} min={0} max={6} onChange={setChd} />
            <Stepper label="Infant" hint="Below 2 years" value={inf} min={0} max={6} onChange={setInf} />
            <p className="mt-2 mb-1.5 text-sm font-bold text-slate-700">Class</p>
            <div className="flex items-center gap-5">
              {["Economy", "Business"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCabin(c)}
                  className="flex cursor-pointer items-center gap-2 text-sm font-bold"
                  role="radio"
                  aria-checked={cabin === c}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2",
                      cabin === c ? "border-brand-900" : "border-slate-300"
                    )}
                  >
                    {cabin === c && <span className="h-2.5 w-2.5 rounded-full bg-brand-900" />}
                  </span>
                  <span className={cabin === c ? "text-brand-950" : "text-slate-400"}>{c}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full cursor-pointer rounded-xl bg-gold-400 py-2.5 text-base font-black text-brand-950 shadow-sm transition hover:bg-gold-300"
            >
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* --------------------------------- widgets -------------------------------- */

function FlightsWidget() {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip>("oneway");
  const [from, setFrom] = useState("DAC");
  const [to, setTo] = useState("CXB");
  const [date, setDate] = useState(todayIso());
  const [returnDate, setReturnDate] = useState("");
  const [adt, setAdt] = useState(1);
  const [chd, setChd] = useState(0);
  const [inf, setInf] = useState(0);
  const [cabin, setCabin] = useState("Economy");

  function pickTrip(t: Trip) {
    setTrip(t);
    if (t === "round" && !returnDate) setReturnDate(plusDays(date, 1));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const total = adt + chd + inf;
    const q = new URLSearchParams({ from, to, date, adt: String(total) });
    if (trip === "round" && returnDate) q.set("returnDate", returnDate);
    router.push(`/flights/search?${q.toString()}`);
  }

  const canSearch = trip === "oneway" || !!returnDate;

  return (
    <form onSubmit={submit}>
      <div className="flex items-center gap-4 sm:gap-5" role="radiogroup" aria-label="Trip type">
        {(
          [
            { id: "oneway", label: "One Way", disabled: false },
            { id: "round", label: "Round Way", disabled: false },
            { id: "multi", label: "Multi City", disabled: true }
          ] as const
        ).map((t) => {
          const active = trip === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={t.disabled}
              title={t.disabled ? "Coming soon" : t.label}
              onClick={() => {
                if (t.id === "oneway" || t.id === "round") pickTrip(t.id);
              }}
              className={cn("flex items-center gap-2", t.disabled ? "cursor-not-allowed" : "cursor-pointer")}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2",
                  active ? "border-brand-900" : t.disabled ? "border-slate-200" : "border-slate-300"
                )}
              >
                {active && <span className="h-2.5 w-2.5 rounded-full bg-brand-900" />}
              </span>
              <span className={cn("text-sm font-extrabold", active ? "text-brand-900" : "text-slate-300")}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.25fr_1.25fr_1fr_1fr_1.15fr]">
        <div className="relative grid gap-3 sm:col-span-2 sm:grid-cols-2 lg:col-span-2">
          <AirportPicker label="FROM" value={from} onChange={setFrom} />
          <button
            type="button"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            aria-label="Swap origin and destination"
            className="absolute top-1/2 left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-brand-700 shadow-card transition hover:rotate-180 max-sm:rotate-90 max-sm:hover:rotate-270"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <AirportPicker label="TO" value={to} onChange={setTo} />
        </div>
        <DateBox
          label="DEPARTURE DATE"
          value={date}
          onChange={setDate}
          min={todayIso()}
          picker={(close, current) => (
            <FareCalendar
              from={from}
              to={to}
              value={current}
              minDate={todayIso()}
              onSelect={(iso) => {
                setDate(iso);
                if (trip === "round" && returnDate && returnDate <= iso) setReturnDate(plusDays(iso, 1));
                close();
              }}
              title="Select journey date"
            />
          )}
        />
        {trip === "round" ? (
          <DateBox
            label="RETURN DATE"
            value={returnDate}
            onChange={setReturnDate}
            min={plusDays(date, 0)}
            onClear={() => setReturnDate("")}
            picker={(close, current) => (
              <FareCalendar
                from={from}
                to={to}
                value={current || plusDays(date, 1)}
                minDate={date}
                onSelect={(iso) => {
                  setReturnDate(iso);
                  close();
                }}
                title="Select return date"
              />
            )}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-[11px] font-bold tracking-wider text-slate-500">RETURN DATE</p>
            <p className="mt-0.5 text-sm leading-snug text-slate-400">Save more on return flight</p>
          </div>
        )}
        <TravelerBox
          adt={adt}
          setAdt={setAdt}
          chd={chd}
          setChd={setChd}
          inf={inf}
          setInf={setInf}
          cabin={cabin}
          setCabin={setCabin}
        />
      </div>

      <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2">
        <button type="submit" disabled={!canSearch} className={GOLD_SEARCH}>
          Search
        </button>
      </div>
    </form>
  );
}

function HotelsWidget() {
  const router = useRouter();
  const [city, setCity] = useState("Cox's Bazar");
  const [checkIn, setCheckIn] = useState(todayIso());
  const [checkOut, setCheckOut] = useState(plusDays(todayIso(), 1));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/hotels/search?${new URLSearchParams({ city, checkIn, checkOut }).toString()}`);
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-bold tracking-wider text-slate-500">CITY</p>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger
              aria-label="City"
              className="mt-0.5 h-auto gap-1 rounded-none border-0 p-0 text-xl font-extrabold text-brand-950 shadow-none focus:ring-0"
            >
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DateBox label="CHECK-IN" value={checkIn} onChange={setCheckIn} min={todayIso()} />
        <DateBox label="CHECK-OUT" value={checkOut} onChange={setCheckOut} min={checkIn} />
      </div>
      <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2">
        <button type="submit" className={GOLD_SEARCH}>
          Search
        </button>
      </div>
    </form>
  );
}

/* ---------------------------------- widget --------------------------------- */

export function HeroSearch() {
  const [tab, setTab] = useState<TabId>("flights");

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)}>
      <div className="relative z-10 mx-auto -mb-7 w-fit max-w-full px-4">
        <TabsList className="rounded-2xl border border-slate-200 bg-white p-2 shadow-pop">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="rounded-xl px-4 data-[state=active]:border-b-[3px] data-[state=active]:border-b-gold-400 data-[state=active]:bg-none data-[state=active]:text-brand-900 data-[state=active]:shadow-none data-[state=inactive]:hover:bg-slate-100 sm:px-6"
            >
              <t.icon /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="relative rounded-3xl bg-white px-4 pt-14 pb-16 shadow-pop sm:px-6">
        <TabsContent value="flights" className="p-0 sm:p-0">
          <FlightsWidget />
        </TabsContent>
        <TabsContent value="hotels" className="p-0 sm:p-0">
          <HotelsWidget />
        </TabsContent>
        <TabsContent value="tours" className="p-0 sm:p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-8">
            <p className="text-sm text-slate-600">
              Curated domestic escapes — Cox&apos;s Bazar, Saint Martin, Bandarban and more.
            </p>
            <a href="/tours" className={btnCls("accent", "lg")}>
              Browse tours
            </a>
          </div>
        </TabsContent>
        <TabsContent value="visa" className="p-0 sm:p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-8">
            <p className="text-sm text-slate-600">
              Thailand, Malaysia, Singapore &amp; more — guided applications with tracking.
            </p>
            <a href="/visa" className={btnCls("accent", "lg")}>
              Explore visas
            </a>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
