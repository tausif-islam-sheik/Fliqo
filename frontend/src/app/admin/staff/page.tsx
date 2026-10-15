"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { api } from "@/lib/api/client";
import { Badge, Card, PageHeader, StatusBadge, TableShell, Td, Th, inputCls } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function AdminStaffPage() {
  const staff = useQuery({ queryKey: ["staff"], queryFn: () => api<any[]>("/staff") });
  const roles = useQuery({ queryKey: ["roles"], queryFn: () => api<any[]>("/roles") });
  const activity = useQuery({ queryKey: ["activity"], queryFn: () => api<any[]>("/activity") });
  const [invite, setInvite] = useState({ email: "", name: "", roleId: "" });
  const [notice, setNotice] = useState<string | null>(null);

  async function sendInvite() {
    setNotice(null);
    await api("/staff/invite", { method: "POST", body: JSON.stringify(invite) });
    setInvite({ email: "", name: "", roleId: "" });
    staff.refetch();
    setNotice("Invite sent.");
  }

  return (
    <div>
      <PageHeader eyebrow="Team" title="Staff" subtitle="Roles, invites and access control." />
      {notice && <p className="mb-3 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800">{notice}</p>}

      <Card className="p-5">
        <h3 className="flex items-center gap-2 font-extrabold text-slate-900"><UserPlus className="h-4 w-4 text-brand-600" /> Invite staff</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <input placeholder="Email" type="email" aria-label="Invite email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} className={inputCls} />
          <input placeholder="Name" aria-label="Invite name" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} className={inputCls} />
          <Select value={invite.roleId || "none"} onValueChange={(v) => setInvite({ ...invite, roleId: v === "none" ? "" : v })}>
            <SelectTrigger aria-label="Role">
              <SelectValue placeholder="Role…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Role…</SelectItem>
              {(roles.data ?? []).map((r: any) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={sendInvite}
            disabled={!invite.email || !invite.roleId}
            className="cursor-pointer rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            Invite
          </button>
        </div>
      </Card>

      <div className="mt-4">
        <TableShell>
          <thead>
            <tr>
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>2FA</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(staff.data ?? []).map((s: any) => (
              <tr key={s.id} className="transition hover:bg-brand-50/50">
                <Td className="font-semibold">{s.email}</Td>
                <Td>{s.name}</Td>
                <Td><Badge tone="purple">{s.role?.name ?? "—"}</Badge></Td>
                <Td><StatusBadge status={s.status} /></Td>
                <Td>{s.twoFactorEnabled ? <Badge tone="green">on</Badge> : <Badge tone="slate">off</Badge>}</Td>
                <Td>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() =>
                        api(`/staff/${s.id}/suspend`, { method: "POST", body: JSON.stringify({ suspend: s.status === "ACTIVE" }) }).then(() => staff.refetch())
                      }
                      className="cursor-pointer rounded-full border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-amber-400 hover:text-amber-700"
                    >
                      {s.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                    </button>
                    <button
                      onClick={() => api(`/staff/${s.id}/force-logout`, { method: "POST", body: "{}" }).then(() => setNotice(`${s.email} logged out everywhere.`))}
                      className="cursor-pointer rounded-full border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-red-300 hover:text-red-700"
                    >
                      Force logout
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-extrabold text-slate-900"><KeyRound className="h-4 w-4 text-brand-600" /> Roles & permissions</h3>
          <div className="mt-3 space-y-2">
            {(roles.data ?? []).map((r: any) => (
              <div key={r.id} className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-extrabold text-slate-900">{r.name}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {(r.permissions ?? []).map((p: any) => (
                    <span key={p.permission.key} className="rounded-full bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-600 ring-1 ring-slate-200 ring-inset">
                      {p.permission.key}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-extrabold text-slate-900"><ShieldCheck className="h-4 w-4 text-brand-600" /> Activity log</h3>
          <div className="mt-3">
            <TableShell>
              <thead>
                <tr>
                  <Th>When</Th>
                  <Th>Action</Th>
                  <Th>Entity</Th>
                </tr>
              </thead>
              <tbody>
                {(activity.data ?? []).slice(0, 30).map((a: any) => (
                  <tr key={a.id}>
                    <Td className="whitespace-nowrap text-xs">{new Date(a.createdAt).toLocaleString()}</Td>
                    <Td className="font-mono text-xs">{a.action}</Td>
                    <Td className="text-xs">{a.entity} {a.entityId ?? ""}</Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </div>
        </Card>
      </div>
    </div>
  );
}
