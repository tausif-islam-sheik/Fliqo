"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pause, Play, Plus, Send } from "lucide-react";
import { api } from "@/lib/api/client";
import { Card, Field, PageHeader, StatusBadge, TableShell, Td, Th, inputCls, textareaCls } from "@/components/ui";

export default function AdminCampaignsPage() {
  const { data, refetch } = useQuery({ queryKey: ["campaigns"], queryFn: () => api<any[]>("/campaigns") });
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("<p>Hello {{name}}, new fares to Cox's Bazar!</p>");
  const [testEmail, setTestEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  async function create() {
    await api("/campaigns", { method: "POST", body: JSON.stringify({ name, subject, htmlBody: html }) });
    setName("");
    setSubject("");
    refetch();
  }

  return (
    <div>
      <PageHeader eyebrow="Marketing" title="Email campaigns" subtitle="Draft, test, send and track in one place." />
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Card className="h-fit p-5">
          <h3 className="flex items-center gap-2 font-extrabold text-slate-900"><Plus className="h-4 w-4 text-brand-600" /> New campaign</h3>
          <div className="mt-3 grid gap-3">
            <Field label="Campaign name">
              <input placeholder="Eid getaway blast" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Subject">
              <input placeholder="Fares from ৳4,999 ✈" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
            </Field>
            <Field label="HTML body">
              <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={5} className={`${textareaCls} font-mono text-xs`} />
            </Field>
            <button onClick={create} disabled={!name || !subject} className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60">
              Create draft
            </button>
          </div>
        </Card>

        <div>
          <TableShell>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Sent</Th>
                <Th>Opened</Th>
                <Th>Clicked</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((c: any) => (
                <tr key={c.id} className="transition hover:bg-brand-50/50">
                  <Td className="font-semibold">{c.name}</Td>
                  <Td><StatusBadge status={c.status} /></Td>
                  <Td>{c.sent}</Td>
                  <Td>{c.opened}</Td>
                  <Td>{c.clicked}</Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => api(`/campaigns/${c.id}/start`, { method: "POST", body: "{}" }).then(() => refetch())}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-brand-700"
                      >
                        <Play className="h-3 w-3" /> Start
                      </button>
                      <button
                        onClick={() => api(`/campaigns/${c.id}/pause`, { method: "POST", body: "{}" }).then(() => refetch())}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-brand-400 hover:text-brand-700"
                      >
                        <Pause className="h-3 w-3" /> Pause
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>

          <Card className="mt-4 flex flex-wrap items-end gap-2 p-4">
            <div className="min-w-52 flex-1">
              <Field label="Test email">
                <input placeholder="you@example.com" type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <button
              onClick={() => {
                const first = (data ?? [])[0];
                if (first && testEmail)
                  api(`/campaigns/${first.id}/test`, { method: "POST", body: JSON.stringify({ email: testEmail }) }).then(() => setNotice("Test sent to " + testEmail));
              }}
              disabled={!testEmail || !(data ?? []).length}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:text-brand-700 disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> Send test (latest)
            </button>
          </Card>
          {notice && <p className="mt-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800">{notice}</p>}
        </div>
      </div>
    </div>
  );
}
