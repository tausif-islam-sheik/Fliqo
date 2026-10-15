import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    const post = await fetch(`${api}/blog/${slug}`, { next: { revalidate: 3600 } }).then((r) => (r.ok ? r.json() : null));
    if (post) return { title: `${post.title} | Fliqo Blog`, description: post.excerpt ?? undefined };
  } catch {}
  return { title: "Blog | Fliqo" };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  const post = await fetch(`${api}/blog/${slug}`, { next: { revalidate: 3600 } })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  if (!post)
    return (
      <Container className="max-w-3xl py-12">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Post not found.
        </div>
      </Container>
    );
  const jsonLd = { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.excerpt };
  return (
    <Container className="max-w-3xl py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All articles
      </Link>
      <p className="mt-4 text-xs font-bold tracking-[0.18em] text-brand-600 uppercase">Fliqo blog</p>
      <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{post.title}</h1>
      {post.excerpt && <p className="mt-3 text-lg text-slate-500">{post.excerpt}</p>}
      <article className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <pre className="font-sans text-[15px] leading-relaxed whitespace-pre-wrap text-slate-700">{post.content}</pre>
      </article>
    </Container>
  );
}
