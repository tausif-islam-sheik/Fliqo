"use client";

import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string | null | undefined): Date | undefined {
  if (!s) return undefined;
  const d = parseISO(s);
  return isValid(d) ? d : undefined;
}

export function formatISODate(s: string | null | undefined, fallback = "Select date"): string {
  const d = parseISODate(s);
  return d ? format(d, "dd MMM yyyy") : fallback;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Select date",
  ariaLabel = "Pick a date",
  className,
  align = "start"
}: {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  align?: "start" | "center" | "end";
}) {
  const [open, setOpen] = useState(false);
  const selected = parseISODate(value);
  const minDate = parseISODate(min);
  const maxDate = parseISODate(max);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={ariaLabel}
          className={cn(
            "h-11 w-full justify-start px-3.5 py-2 text-left text-sm font-medium",
            !selected && "text-slate-400",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-slate-500" />
          {selected ? format(selected, "dd MMM yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? minDate ?? maxDate ?? new Date()}
          captionLayout="dropdown"
          startMonth={minDate ?? new Date()}
          endMonth={maxDate ?? new Date(new Date().getFullYear() + 2, 11, 31)}
          onSelect={(d) => {
            if (d) {
              onChange(toISODate(d));
              setOpen(false);
            }
          }}
          disabled={[
            ...(minDate ? [{ before: minDate }] : []),
            ...(maxDate ? [{ after: maxDate }] : [])
          ]}
        />
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
          <span className="text-xs font-medium text-slate-400">
            {selected ? format(selected, "EEEE, dd MMM yyyy") : "No date selected"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const today = new Date();
              const next = minDate && today < minDate ? minDate : today;
              onChange(toISODate(next));
              setOpen(false);
            }}
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
