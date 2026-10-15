"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Globe, Newspaper, Tag } from "lucide-react";
import { api } from "@/lib/api/client";
import { Card, Field, PageHeader, inputCls, textareaCls } from "@/components/ui";

function useSaver() {
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function save(path: string, body: unknown, label: string) {
    setSaved(null);
    setError(null);
    try {
      await api(path, { method: "POST", body: JSON.stringify(body) });
      setSaved(label);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return { saved, error, save };
}

export default function AdminContentPage() {
  const [offer, setOffer] = useState({ slug: "", title: "" });
  const [post, setPost] = useState({ slug: "", title: "", excerpt: "", content: "", published: true });
  const [page, setPage] = useState({ slug: "faq", title: "FAQ", content: "" });
  const { saved, error, save } = useSaver();

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="CMS" title="Content" subtitle="Offers, blog posts and CMS pages go live instantly." />
      {(saved || error) && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {error ?? (
            <span className="flex items-center gap-1.5 font-bold"><CheckCircle2 className="h-4 w-4" /> {saved} saved.</span>
          )}
        </div>
      )}

      <Card className="p-5">
        <h3 className="flex items-center gap-2 font-extrabold text-slate-900"><Tag className="h-4 w-4 text-brand-600" /> Offer</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input placeholder="slug" aria-label="Offer slug" value={offer.slug} onChange={(e) => setOffer({ ...offer, slug: e.target.value })} className={inputCls} />
          <input placeholder="Title" aria-label="Offer title" value={offer.title} onChange={(e) => setOffer({ ...offer, title: e.target.value })} className={inputCls} />
          <button onClick={() => save("/admin/offers", offer, "Offer")} className="cursor-pointer rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700">
            Save
          </button>
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <h3 className="flex items-center gap-2 font-extrabold text-slate-900"><Newspaper className="h-4 w-4 text-brand-600" /> Blog post <span className="text-xs font-semibold text-slate-400">(Markdown)</span></h3>
        <div className="mt-3 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Slug"><input placeholder="cox-bazar-guide" value={post.slug} onChange={(e) => setPost({ ...post, slug: e.target.value })} className={inputCls} /></Field>
            <Field label="Title"><input placeholder="Post title" value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label="Excerpt"><input placeholder="One-line summary" value={post.excerpt} onChange={(e) => setPost({ ...post, excerpt: e.target.value })} className={inputCls} /></Field>
          <Field label="Content"><textarea rows={5} value={post.content} onChange={(e) => setPost({ ...post, content: e.target.value })} className={textareaCls} /></Field>
          <div>
            <button onClick={() => save("/admin/blog", post, "Blog post")} className="cursor-pointer rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700">
              Publish
            </button>
          </div>
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <h3 className="flex items-center gap-2 font-extrabold text-slate-900"><Globe className="h-4 w-4 text-brand-600" /> CMS page</h3>
        <div className="mt-3 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Slug"><input placeholder="faq" value={page.slug} onChange={(e) => setPage({ ...page, slug: e.target.value })} className={inputCls} /></Field>
            <Field label="Title"><input placeholder="Page title" value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label="Content"><textarea rows={5} value={page.content} onChange={(e) => setPage({ ...page, content: e.target.value })} className={textareaCls} /></Field>
          <div className="flex items-center gap-2">
            <button onClick={() => save("/admin/pages", page, "CMS page")} className="cursor-pointer rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700">
              Save page
            </button>
            <span className="flex items-center gap-1 text-xs text-slate-400"><FileText className="h-3.5 w-3.5" /> Renders at /faq &amp; friends</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
