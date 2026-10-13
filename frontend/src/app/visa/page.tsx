"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Clock, Stamp } from "lucide-react";
import { useVisaCountries } from "@/lib/query/catalog";
import { bdt, Btn, Card, Container, EmptyState, LoadingState, PageHeader } from "@/components/ui";

export default function VisaPage() {
  const router = useRouter();
  const { data, isLoading } = useVisaCountries();
  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Visa"
        title="Visa services"
        subtitle="Guided applications, document checklists and live tracking."
        actions={<Btn href="/visa/track" variant="outline">Track application</Btn>}
      />
      {isLoading && <LoadingState label="Loading countries…" />}
      {!isLoading && (data ?? []).length === 0 && (
        <EmptyState title="No visa services right now" hint="New destinations are added regularly." />
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((c: any) => (
          <Card key={c.code} className="flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-pop">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Stamp className="h-5 w-5" />
            </span>
            <p className="mt-3 text-lg font-extrabold text-slate-900">{c.name}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <Clock className="h-3.5 w-3.5" /> ~{c.processingDays} days processing
            </p>
            <p className="mt-2 text-xl font-black text-brand-700">{bdt(c.fee)}</p>
            <Btn size="sm" onClick={() => router.push(`/visa/${c.code}`)} className="mt-4 w-full">
              Requirements & apply <ArrowRight className="h-3.5 w-3.5" />
            </Btn>
          </Card>
        ))}
      </div>
      <p className="mt-6 rounded-2xl bg-slate-100 p-4 text-center text-sm text-slate-600">
        Applied already? Track with your booking ref:{" "}
        <a href="/visa/track" className="font-bold text-brand-700 hover:underline">track application</a>
      </p>
    </Container>
  );
}
