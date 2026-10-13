"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { api } from "@/lib/api/client";
import { Badge, EmptyState, PageHeader, StatusBadge, TableShell, Td, Th, inputCls } from "@/components/ui";

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api<any[]>(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`)
  });

  return (
    <div>
      <PageHeader eyebrow="Customers" title="Users" subtitle={`${(data ?? []).length} accounts`} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          refetch();
        }}
        className="flex gap-2"
      >
        <input placeholder="Search email / name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" className={inputCls} />
        <button type="submit" className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700">
          <Search className="h-4 w-4" /> Search
        </button>
      </form>

      <div className="mt-4">
        <TableShell>
          <thead>
            <tr>
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Verified</Th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u: any) => (
              <tr key={u.id} className="transition hover:bg-brand-50/50">
                <Td className="font-semibold">{u.email}</Td>
                <Td>{u.name}</Td>
                <Td><Badge tone={u.type === "STAFF" ? "purple" : "slate"}>{u.type}</Badge></Td>
                <Td><StatusBadge status={u.status} /></Td>
                <Td>{u.emailVerifiedAt ? <Badge tone="green">yes</Badge> : <Badge tone="amber">no</Badge>}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
        {!isLoading && (data ?? []).length === 0 && (
          <div className="mt-3">
            <EmptyState title="No users found" hint="Try a different search term." />
          </div>
        )}
      </div>
    </div>
  );
}
