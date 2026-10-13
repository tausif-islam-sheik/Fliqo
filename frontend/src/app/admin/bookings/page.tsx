"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { api } from "@/lib/api/client";
import { bdt, Card, EmptyState, PageHeader, StatusBadge, TableShell, Td, Th } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const STATUSES = ["PENDING_PAYMENT", "PAID", "TICKETING", "CONFIRMED", "EXPIRED", "PAYMENT_FAILED", "CANCELLED", "REFUNDED"];
const TYPES = ["FLIGHT", "HOTEL", "TOUR", "VISA"];

export default function AdminBookingsPage() {
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-bookings", status, type],
    queryFn: () => {
      const q = new URLSearchParams();
      if (status) q.set("status", status);
      if (type) q.set("type", type);
      return api<any[]>(`/admin/bookings?${q.toString()}`);
    }
  });

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Bookings"
        subtitle={`${(data ?? []).length} records`}
        actions={
          <button onClick={() => refetch()} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />
      <Card className="flex flex-wrap gap-3 p-4">
        <div className="min-w-44 flex-1">
          <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500 uppercase">Status</span>
          <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
            <SelectTrigger aria-label="Status filter">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-44 flex-1">
          <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500 uppercase">Product</span>
          <Select value={type || "all"} onValueChange={(v) => setType(v === "all" ? "" : v)}>
            <SelectTrigger aria-label="Product filter">
              <SelectValue placeholder="All products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              {TYPES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="mt-4">
        <TableShell>
          <thead>
            <tr>
              <Th>Ref</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Total</Th>
              <Th>Contact</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((b: any) => (
              <tr key={b.id} className="transition hover:bg-brand-50/50">
                <Td className="font-mono text-xs font-bold">{b.bookingRef}</Td>
                <Td>{b.type}</Td>
                <Td><StatusBadge status={b.status} /></Td>
                <Td className="font-bold whitespace-nowrap">{b.currency} {bdt(b.totalAmount)}</Td>
                <Td className="max-w-52 truncate">{b.contactEmail}</Td>
                <Td className="whitespace-nowrap text-xs">{new Date(b.createdAt).toLocaleString()}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
        {!isLoading && (data ?? []).length === 0 && (
          <div className="mt-3">
            <EmptyState title="No bookings match" hint="Try widening the filters." />
          </div>
        )}
      </div>
    </div>
  );
}
