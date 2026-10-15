"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Compass,
  Hotel,
  LogIn,
  Menu,
  Newspaper,
  Phone,
  Plane,
  Stamp,
  Tag,
  User,
  X
} from "lucide-react";
import { Container, cx } from "@/components/ui";

const NAV = [
  { href: "/flights/search", label: "Flights", icon: Plane },
  { href: "/hotels/search", label: "Hotels", icon: Hotel },
  { href: "/tours", label: "Tours", icon: Compass },
  { href: "/visa", label: "Visa", icon: Stamp },
  { href: "/offers", label: "Offers", icon: Tag },
  { href: "/blog", label: "Blog", icon: Newspaper }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      {/* utility strip */}
      <div className="bg-brand-950 text-white">
        <Container className="flex h-9 items-center justify-between text-xs">
          <p className="flex items-center gap-1.5 text-brand-100">
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">24/7 support:</span> 09638-XXXXXX
          </p>
          <div className="flex items-center gap-4">
            <Link href="/faq" className="text-brand-100 transition hover:text-white">
              FAQ
            </Link>
            <Link href="/contact" className="text-brand-100 transition hover:text-white">
              Contact
            </Link>
            <Link
              href="/account"
              className="hidden items-center gap-1 text-brand-100 transition hover:text-white sm:inline-flex"
            >
              <User className="h-3.5 w-3.5" /> My account
            </Link>
          </div>
        </Container>
      </div>

      {/* main bar */}
      <div className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2" aria-label="Fliqo home">
            <span className="font-display text-2xl font-extrabold tracking-tight text-brand-950">
              Fliqo
              <span className="text-gold-500">.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50"
            >
              <LogIn className="h-4 w-4" /> Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800"
            >
              Sign up
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </Container>

        {/* mobile menu */}
        {open && (
          <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden" aria-label="Mobile">
            <div className="grid gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 shadow-sm"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg bg-brand-700 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
