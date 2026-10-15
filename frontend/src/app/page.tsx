import { ArrowRight, BadgePercent, Headset, MapPin, ShieldCheck, Wallet } from "lucide-react";
import { HeroSearch } from "@/components/home/HeroSearch";
import { FeaturedHotels, FeaturedTours, OffersPreview } from "@/components/home/HomeSections";
import { Btn, Container } from "@/components/ui";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "Fliqo",
  description: "Bangladesh-first OTA: flights, hotels, tours and visa in BDT."
};

const DESTINATIONS = [
  {
    city: "Cox's Bazar",
    code: "CXB",
    blurb: "World's longest sea beach",
    href: "/flights/search?from=DAC&to=CXB",
    gradient: "from-sky-600 via-blue-600 to-brand-800",
    image: "/images/seed/beach.jpg"
  },
  {
    city: "Chittagong",
    code: "CGP",
    blurb: "Port city & hills",
    href: "/flights/search?from=DAC&to=CGP",
    gradient: "from-brand-600 via-brand-700 to-brand-950",
    image: "/images/seed/palm-beach.jpg"
  },
  {
    city: "Dhaka",
    code: "DAC",
    blurb: "Capital connections",
    href: "/flights/search?from=CGP&to=DAC",
    gradient: "from-blue-500 via-brand-700 to-brand-950",
    image: "/images/seed/city-night.jpg"
  }
];

const WHY = [
  { icon: BadgePercent, title: "Best price in BDT", text: "Transparent fares with no hidden fees — pay exactly what you see." },
  { icon: Wallet, title: "Pay your way", text: "Cards, bKash, Nagad, Rocket and bank transfer with instant confirmation." },
  { icon: ShieldCheck, title: "Verified & secure", text: "Direct supplier contracts, secure checkout and e-tickets in minutes." },
  { icon: Headset, title: "24/7 human support", text: "Real travel experts on call before, during and after your trip." }
];

export default function HomePage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-slate-50">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 55% 45% at 12% 18%, rgba(255,255,255,.9), transparent 60%), radial-gradient(ellipse 45% 40% at 88% 12%, rgba(255,255,255,.8), transparent 60%), radial-gradient(ellipse 60% 50% at 55% 100%, rgba(125,211,252,.5), transparent 65%)"
          }}
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 h-96 w-96 rotate-12 rounded-[3rem] bg-white/40 blur-3xl"
        />
        <Container className="relative py-10 sm:py-14">
          <div className="animate-fade-up">
            <HeroSearch />
          </div>
          <div className="mt-14 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            {["bKash", "Nagad", "Visa", "Mastercard", "SSLCommerz"].map((p) => (
              <span key={p} className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200 ring-inset">
                {p}
              </span>
            ))}
            <span className="ml-1">· Secure checkout</span>
          </div>
        </Container>
      </section>

      {/* destinations */}
      <Container className="pt-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-bold tracking-[0.18em] text-brand-600 uppercase">Trending</p>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Popular destinations
            </h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {DESTINATIONS.map((d) => (
            <a
              key={d.code}
              href={d.href}
              className={`group relative overflow-hidden rounded-lg bg-gradient-to-br ${d.gradient} p-5 text-white shadow-card ring-1 ring-white/20 ring-inset transition hover:-translate-y-0.5 hover:shadow-pop`}
            >
              <img
                src={d.image}
                alt={d.city}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-brand-950/20 to-transparent" />
              <div className="relative text-shadow-hero">
                <p className="text-4xl font-black tracking-tight opacity-90">{d.code}</p>
                <p className="mt-1 flex items-center gap-1.5 font-extrabold">
                  <MapPin className="h-4 w-4" /> {d.city}
                </p>
                <p className="mt-0.5 text-sm text-white/85">{d.blurb}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold">
                  Find flights <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </Container>

      {/* dynamic sections */}
      <Container className="mt-12 space-y-12">
        <FeaturedTours />
        <FeaturedHotels />
        <OffersPreview />
      </Container>

      {/* why fliqo */}
      <section className="mt-14 bg-white py-12">
        <Container>
          <p className="mb-1 text-xs font-bold tracking-[0.18em] text-brand-600 uppercase">Why Fliqo</p>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Travel booking, minus the headache
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <w.icon className="h-5 w-5" />
                </span>
                <p className="mt-3 font-extrabold text-slate-900">{w.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{w.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Btn href="/flights/search" size="lg">Start searching</Btn>
            <Btn href="/tours" variant="outline" size="lg">Browse tours</Btn>
          </div>
        </Container>
      </section>
    </main>
  );
}
