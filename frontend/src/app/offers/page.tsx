"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Tag } from "lucide-react";
import { api } from "@/lib/api/client";
import { Card, Container, EmptyState, LoadingState, PageHeader } from "@/components/ui";

export default function OffersPage() {
  const { data, isLoading } = useQuery({ queryKey: ["offers"], queryFn: () => api<any[]>("/offers") });
  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Deals"
        title="Offers"
        subtitle="Seasonal discounts, coupon drops and partner deals."
      />
      {isLoading && <LoadingState label="Loading offers…" />}
      {!isLoading && (data ?? []).length === 0 && (
        <EmptyState title="No active offers right now" hint="Check back soon — new deals land every week." />
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((o: any) => (
          <Card key={o.id} className="border-gold-300 bg-gradient-to-br from-gold-100 via-white to-white p-5">
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-gold-700 uppercase">
              <Tag className="h-3.5 w-3.5" /> Offer
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">{o.title}</p>
            {o.validTo && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" /> Valid until{" "}
                {new Date(o.validTo).toLocaleDateString()}
              </p>
            )}
          </Card>
        ))}
      </div>
    </Container>
  );
}
