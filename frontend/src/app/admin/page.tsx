"use client";

import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api/client";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6"];

function useKpis() {
  return useQuery({ queryKey: ["admin-kpis"], queryFn: () => api<any>("/admin/dashboard/kpis"), refetchInterval: 60_000 });
}
function useChart(name: string) {
  return useQuery({ queryKey: ["admin-chart", name], queryFn: () => api<any[]>(`/admin/dashboard/charts/${name}`), refetchInterval: 60_000 });
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="mb-3 font-extrabold text-slate-900">{title}</h3>
      {children}
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: kpis } = useKpis();
  const funnel = useChart("funnel");
  const byProduct = useChart("bookings-by-product");
  const revenue = useChart("revenue-by-product");
  const daily = useChart("revenue-daily");
  const status = useChart("booking-status");

  return (
    <div>
      <PageHeader eyebrow="Overview" title="Dashboard" subtitle="Live business pulse — refreshes every minute." />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Stat label="Revenue (BDT)" value={kpis ? `৳ ${Number(kpis.revenue).toLocaleString("en-IN")}` : "…"} />
        <Stat label="Bookings" value={kpis?.bookings ?? "…"} />
        <Stat label="Conversion" value={kpis ? `${(kpis.conversion * 100).toFixed(1)}%` : "…"} />
        <Stat label="New users" value={kpis?.newUsers ?? "…"} />
        <Stat
          label="Refunds"
          value={kpis ? `${kpis.refunds.count} (৳ ${Number(kpis.refunds.amount).toLocaleString("en-IN")})` : "…"}
        />
        <Stat label="Failed payments" value={kpis?.failedPayments ?? "…"} />
      </div>

      <div className="mt-4">
        <ChartCard title="Revenue per day">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="d" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area dataKey="revenue" fill="#0f6d45" fillOpacity={0.2} stroke="#0f6d45" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ChartCard title="Funnel">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel.data ?? []} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#16a34a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Booking status">
          <div className="flex flex-wrap gap-1.5">
            {(status.data ?? []).map((s: any, i: number) => (
              <span key={i} className="flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1.5 text-xs">
                <Badge tone="slate">{s.name ?? JSON.stringify(s)}</Badge>
                {s.value != null && <b>{s.value}</b>}
              </span>
            ))}
            {(status.data ?? []).length === 0 && <p className="text-sm text-slate-400">No data yet.</p>}
          </div>
        </ChartCard>
        <ChartCard title="Bookings by product">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byProduct.data ?? []} dataKey="value" nameKey="name" outerRadius={80} label={{ fontSize: 12 }}>
                  {(byProduct.data ?? []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Revenue by product">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenue.data ?? []} dataKey="value" nameKey="name" outerRadius={80} label={{ fontSize: 12 }}>
                  {(revenue.data ?? []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
