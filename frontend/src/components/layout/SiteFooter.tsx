import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui";

const EXPLORE = [
  { href: "/flights/search", label: "Flights" },
  { href: "/hotels/search", label: "Hotels" },
  { href: "/tours", label: "Tours" },
  { href: "/visa", label: "Visa" },
  { href: "/offers", label: "Offers" },
  { href: "/blog", label: "Blog" }
];

const COMPANY = [
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/account", label: "My account" },
  { href: "/admin", label: "Staff login" }
];

const PAY_METHODS = ["bKash", "Nagad", "Rocket", "Visa", "Mastercard", "SSLCommerz"];

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-brand-950 text-brand-100">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-extrabold tracking-tight text-white">
            Fliqo<span className="text-gold-400">.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-brand-200">
            Bangladesh-first online travel agency. Search, compare, book and pay in BDT.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {PAY_METHODS.map((p) => (
              <span
                key={p}
                className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-bold text-white"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
        <nav aria-label="Explore">
          <p className="text-xs font-bold tracking-[0.18em] text-brand-300 uppercase">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            {EXPLORE.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Company">
          <p className="text-xs font-bold tracking-[0.18em] text-brand-300 uppercase">Company</p>
          <ul className="mt-3 space-y-2 text-sm">
            {COMPANY.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-brand-300 uppercase">Support</p>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand-300" /> 09638-XXXXXX (24/7)
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-300" /> support@fliqo.com
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-300" /> Dhaka, Bangladesh
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-wrap items-center justify-between gap-2 py-4 text-xs text-brand-300">
          <p>© {new Date().getFullYear()} Fliqo. All rights reserved.</p>
          <p>Prices in BDT · VAT included where applicable</p>
        </Container>
      </div>
    </footer>
  );
}
