"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Newspaper } from "lucide-react";
import { api } from "@/lib/api/client";
import { Btn, Card, Container, EmptyState, LoadingState, PageHeader } from "@/components/ui";

export default function BlogPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ["blog"], queryFn: () => api<any[]>("/blog") });
  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Stories"
        title="Travel blog"
        subtitle="Guides, itineraries and insider tips for traveling in and out of Bangladesh."
      />
      {isLoading && <LoadingState label="Loading posts…" />}
      {!isLoading && (data ?? []).length === 0 && (
        <EmptyState title="No posts yet" hint="Our editors are working on the first stories." />
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((p: any) => (
          <Card key={p.slug} className="flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-pop">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Newspaper className="h-5 w-5" />
            </span>
            <a href={`/blog/${p.slug}`} className="mt-3 text-lg font-extrabold text-slate-900 hover:text-brand-700 hover:underline">
              {p.title}
            </a>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">{p.excerpt}</p>
            <Btn variant="ghost" size="sm" onClick={() => router.push(`/blog/${p.slug}`)} className="mt-3 w-fit px-0">
              Read article <ArrowRight className="h-4 w-4" />
            </Btn>
          </Card>
        ))}
      </div>
    </Container>
  );
}
