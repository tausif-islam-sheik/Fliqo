"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Loader2, Mail, MessageSquare, Phone, Send } from "lucide-react";
import { api } from "@/lib/api/client";
import { Alert, Card, Container, Field, PageHeader, inputCls, textareaCls } from "@/components/ui";

export default function ContactPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sub, setSub] = useState("");
  const [subbed, setSubbed] = useState(false);
  const [subBusy, setSubBusy] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setSubError(null);
    setSubBusy(true);
    try {
      await api("/newsletter/subscribe", { method: "POST", body: JSON.stringify({ email: sub }) });
      setSub("");
      setSubbed(true);
    } catch (err) {
      setSubError((err as Error).message);
    } finally {
      setSubBusy(false);
    }
  }

  return (
    <Container className="max-w-4xl py-10">
      <PageHeader eyebrow="Support" title="Contact & support" subtitle="Real humans, 9am–11pm Asia/Dhaka, every day." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Phone className="h-5 w-5" /></span>
          <div><p className="text-xs font-semibold text-slate-400 uppercase">Hotline</p><p className="font-extrabold">09638-XXXXXX</p></div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Mail className="h-5 w-5" /></span>
          <div><p className="text-xs font-semibold text-slate-400 uppercase">Email</p><p className="font-extrabold">support@fliqo.com</p></div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Clock className="h-5 w-5" /></span>
          <div><p className="text-xs font-semibold text-slate-400 uppercase">Hours</p><p className="font-extrabold">9am – 11pm</p></div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-extrabold text-slate-900">
            <MessageSquare className="h-5 w-5 text-brand-600" /> Send a message
          </h2>
          {sent ? (
            <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-4 w-4" /> Thanks!</p>
              <p className="mt-1">Support will reply by email.</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="mt-4 grid gap-3"
            >
              <Field label="Your email">
                <input placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
              </Field>
              <Field label="How can we help?">
                <textarea placeholder="Tell us about your trip or booking…" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className={textareaCls} required />
              </Field>
              <button type="submit" className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700">
                <Send className="h-4 w-4" /> Send
              </button>
            </form>
          )}
        </Card>

        <Card className="bg-gradient-to-br from-brand-800 to-brand-950 p-6 text-white">
          <h2 className="font-extrabold">Deals by email</h2>
          <p className="mt-1 text-sm text-brand-200">Flash fares and members-only coupons. No spam, unsubscribe anytime.</p>
          {subbed ? (
            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-white/10 p-3 text-sm font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Subscribed — welcome aboard!
            </p>
          ) : (
            <form onSubmit={subscribe} className="mt-4 flex gap-2">
              <input
                placeholder="Email for deals"
                type="email"
                value={sub}
                onChange={(e) => setSub(e.target.value)}
                aria-label="Email for deals"
                className="w-full rounded-full border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-brand-300 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={subBusy}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-gold-400 px-4 py-2.5 text-sm font-extrabold text-brand-950 transition hover:bg-gold-300 disabled:opacity-60"
              >
                {subBusy && <Loader2 className="h-4 w-4 animate-spin" />} Subscribe
              </button>
            </form>
          )}
          {subError && <p className="mt-2 text-sm text-red-300">{subError}</p>}
        </Card>
      </div>
    </Container>
  );
}
