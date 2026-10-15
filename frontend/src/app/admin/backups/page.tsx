"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Archive, DatabaseBackup, HeartPulse, Loader2, Send } from "lucide-react";
import { api } from "@/lib/api/client";
import { Alert, Card, Field, PageHeader, StatusBadge, TableShell, Td, Th, inputCls } from "@/components/ui";

export default function AdminBackupsPage() {
  const { data, refetch } = useQuery({ queryKey: ["backups"], queryFn: () => api<any[]>("/backups") });
  const health = useQuery({ queryKey: ["backup-health"], queryFn: () => api<any>("/backups/health") });
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [restore, setRestore] = useState({ backupId: "", confirmDatabase: "", code: "" });
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runBackup() {
    setBusy(true);
    setError(null);
    try {
      await api("/backups/run", { method: "POST", body: JSON.stringify({ note }) });
      setNote("");
      refetch();
      health.refetch();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Ops"
        title="Backups"
        subtitle={`Last success: ${health.data?.lastSuccess ? new Date(health.data.lastSuccess).toLocaleString() : "never"}`}
        actions={
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 ring-inset">
            <HeartPulse className="h-3.5 w-3.5" /> Health monitored
          </span>
        }
      />

      <Card className="flex flex-wrap items-end gap-2 p-4">
        <div className="min-w-52 flex-1">
          <Field label="Note (optional)">
            <input placeholder="Before campaign launch…" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <button onClick={runBackup} disabled={busy} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseBackup className="h-4 w-4" />}
          {busy ? "Backing up…" : "Back up now"}
        </button>
      </Card>
      {error && <div className="mt-3"><Alert tone="red">{error}</Alert></div>}

      <div className="mt-4">
        <TableShell>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Size</Th>
              <Th>Note</Th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((b: any) => (
              <tr key={b.id} className="transition hover:bg-brand-50/50">
                <Td className="whitespace-nowrap text-xs">{new Date(b.startedAt).toLocaleString()}</Td>
                <Td>{b.type}</Td>
                <Td><StatusBadge status={b.status} /></Td>
                <Td className="whitespace-nowrap">{b.sizeBytes ? `${Math.round(Number(b.sizeBytes) / 1024)} KB` : "—"}</Td>
                <Td className="max-w-64 truncate">{b.note ?? ""}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>

      <Card className="mt-4 border-red-200 p-5">
        <h3 className="flex items-center gap-2 font-extrabold text-red-800">
          <Archive className="h-4 w-4" /> Restore <span className="text-xs font-bold text-red-500">(SuperAdmin · danger zone)</span>
        </h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <input placeholder="Backup id" aria-label="Backup id" value={restore.backupId} onChange={(e) => setRestore({ ...restore, backupId: e.target.value })} className={inputCls} />
          <input placeholder='Type "fliqo" to confirm' aria-label="Confirm phrase" value={restore.confirmDatabase} onChange={(e) => setRestore({ ...restore, confirmDatabase: e.target.value })} className={inputCls} />
          <input placeholder="Email code" aria-label="Email code" value={restore.code} onChange={(e) => setRestore({ ...restore, code: e.target.value })} className={inputCls} />
          <button
            onClick={() => api("/backups/restore-code", { method: "POST", body: "{}" }).then(() => setNotice("Code sent to your email.")).catch((e) => setError((e as Error).message))}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-brand-400 hover:text-brand-700"
          >
            <Send className="h-4 w-4" /> Send code
          </button>
          <button
            onClick={() =>
              api("/backups/restore", { method: "POST", body: JSON.stringify(restore) })
                .then(() => setNotice("Restore started — watch status above."))
                .catch((e) => setError((e as Error).message))
            }
            className="cursor-pointer rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Restore
          </button>
        </div>
        {notice && <p className="mt-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800">{notice}</p>}
      </Card>
    </div>
  );
}
