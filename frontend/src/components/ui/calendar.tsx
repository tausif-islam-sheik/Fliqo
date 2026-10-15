"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const navBtn =
  "flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900";

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-3",
        month_caption: "relative flex h-9 items-center justify-center",
        caption_label: "font-display text-[15px] font-extrabold tracking-tight text-brand-950",
        dropdowns: "flex items-center gap-1.5",
        nav: "absolute inset-x-0 flex items-center justify-between",
        button_previous: cn(navBtn, "absolute left-0"),
        button_next: cn(navBtn, "absolute right-0"),
        weekdays: "flex border-b border-slate-100 pb-2",
        weekday: "w-9 text-center text-[11px] font-bold tracking-wider text-slate-400 uppercase",
        weeks: "flex flex-col gap-0.5",
        week: "flex",
        day: "p-0",
        day_button:
          "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-sm font-semibold text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-800",
        selected:
          "bg-brand-700! font-bold text-white! shadow-sm hover:bg-brand-800! hover:text-white!",
        today: "font-extrabold text-brand-700 ring-1 ring-brand-400 ring-inset",
        outside: "text-slate-300! font-normal",
        disabled: "text-slate-300 opacity-50",
        hidden: "invisible",
        ...classNames
      }}
      components={{
        Chevron: ({ orientation, ...props }: { orientation?: "up" | "down" | "left" | "right" } & Omit<React.SVGProps<SVGSVGElement>, "orientation">) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" {...props} />
          ) : (
            <ChevronRight className="h-4 w-4" {...props} />
          ),
        Dropdown: ({ value, onChange, options }: any) => (
          <select
            value={value}
            onChange={onChange}
            aria-label="Choose month or year"
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-1.5 py-1.5 text-sm font-bold text-slate-900 transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-none"
          >
            {(options as Array<{ value: string; label: string; disabled?: boolean }>).map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
          </select>
        )
      }}
      {...props}
    />
  );
}
