"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Archive,
  BookOpen,
  FileText,
  LayoutDashboard,
  Loader2,
  Mail,
  Ticket,
  Users
} from "lucide-react";
import { api } from "@/lib/api/client";
import { Container, cx } from "@/components/ui";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: Ticket },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/campaigns", label: "Campaigns", icon: Mail },
  { href: "/admin/backups", label: "Backups", icon: Archive },
  { href: "/admin/staff", label: "Staff", icon: BookOpen }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState<boolean | null>(null);

  // Invitees aren't staff yet — accept page stays public
  const isPublicInvite = pathname === "/admin/accept-invite";

  useEffect(() => {
    if (isPublicInvite) return;
    api<any>("/users/me")
      .then((me) => {
        if (me.type !== "STAFF") router.replace("/login");
        else setOk(true);
      })
      .catch(() => router.replace("/login"));
  }, [router, isPublicInvite]);

  if (isPublicInvite) return <>{children}</>;

  if (ok === null)
    return (
      <Container className="py-12">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" /> Checking staff access…
        </div>
      </Container>
    );
  return (
    <div className="bg-slate-100">
      <Container className="flex flex-col gap-5 py-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-60">
          <nav className="rounded-lg bg-brand-950 p-3 lg:sticky lg:top-32" aria-label="Admin">
            <p className="font-display px-3 pt-2 pb-3 text-sm font-extrabold tracking-tight text-white">
              Fliqo <span className="text-gold-400">Admin</span>
            </p>
            <div className="grid gap-1">
              {LINKS.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cx(
                      "flex items-center gap-2.5 rounded-full px-3 py-2.5 text-sm font-semibold transition",
                      active
                        ? "bg-white/15 text-white"
                        : "text-brand-200 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <l.icon className="h-4 w-4" /> {l.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </Container>
    </div>
  );
}
