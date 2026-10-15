import { CircleHelp } from "lucide-react";
import { Card, Container, PageHeader } from "@/components/ui";

async function getPage(slug: string, fallback: { title: string; content: string }) {
  try {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    const page = await fetch(`${api}/pages/${slug}`, { next: { revalidate: 3600 } }).then((r) => (r.ok ? r.json() : null));
    return page ?? fallback;
  } catch {
    return fallback;
  }
}

export default async function FaqPage() {
  const page = await getPage("faq", { title: "FAQ", content: "How do I pay?\n\nCards, bKash, Nagad and bank via our secure checkout.\n\nCan I cancel?\n\nHotel and tour bookings follow the stated cancellation policy. Flight reissues are handled by support." });
  const blocks = page.content.split(/\n\n+/);
  return (
    <Container className="max-w-3xl py-10">
      <PageHeader eyebrow="Help" title={page.title} subtitle="Quick answers to common questions." />
      <Card className="divide-y divide-slate-100 p-2">
        {blocks.map((b: string, i: number) =>
          i % 2 === 0 ? (
            <div key={i} className="flex items-start gap-3 p-4">
              <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <p className="font-extrabold text-slate-900">{b}</p>
            </div>
          ) : (
            <p key={i} className="px-4 py-4 pl-12 text-sm leading-relaxed whitespace-pre-wrap text-slate-600">{b}</p>
          )
        )}
      </Card>
      <p className="mt-6 rounded-lg bg-brand-50 p-4 text-center text-sm text-brand-800">
        Still stuck? <a href="/contact" className="font-bold underline">Contact support</a> — we reply fast.
      </p>
    </Container>
  );
}
