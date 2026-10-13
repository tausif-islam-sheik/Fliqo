"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, LogOut, Mail, Ticket, User } from "lucide-react";
import { api } from "@/lib/api/client";
import { Alert, Badge, Btn, Card, Container, LoadingState, PageHeader } from "@/components/ui";

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api("/users/me")
      .then(setMe)
      .catch((e) => setError((e as Error).message));
  }, []);

  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  }

  if (error)
    return (
      <Container className="py-12">
        <Alert tone="red">
          Session expired — <a href="/login" className="font-bold underline">log in</a> again.
        </Alert>
      </Container>
    );
  if (!me)
    return (
      <Container className="py-12">
        <LoadingState label="Loading your account…" />
      </Container>
    );

  return (
    <Container className="py-10">
      <PageHeader
        eyebrow="My account"
        title={`Hi, ${me.name}`}
        subtitle={me.email}
        actions={
          <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:text-red-700">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <User className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Profile</p>
            <p className="font-extrabold text-slate-900">{me.name}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Email</p>
            <p className="flex items-center gap-2 font-extrabold text-slate-900">
              {me.emailVerifiedAt ? (
                <Badge tone="green"><BadgeCheck className="h-3 w-3" /> Verified</Badge>
              ) : (
                <Badge tone="amber">Unverified</Badge>
              )}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Ticket className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Bookings</p>
            <Btn href="/payment/success" variant="ghost" size="sm" className="-ml-2">
              Track a booking →
            </Btn>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-extrabold text-slate-900">Quick actions</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Btn href="/flights/search" variant="outline">Book a flight</Btn>
            <Btn href="/hotels/search" variant="outline">Book a hotel</Btn>
            <Btn href="/tours" variant="outline">Browse tours</Btn>
            <Btn href="/visa/track" variant="outline">Track visa</Btn>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-extrabold text-slate-900">Account details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-semibold text-slate-900">{me.name}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-semibold text-slate-900">{me.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Status</dt>
              <dd>{me.emailVerifiedAt ? <Badge tone="green">Verified</Badge> : <Badge tone="amber">Pending verification</Badge>}</dd>
            </div>
          </dl>
          {me.emailVerifiedAt ? null : (
            <Btn href={`/verify-email?email=${encodeURIComponent(me.email)}`} size="sm" className="mt-4">
              Verify email now
            </Btn>
          )}
        </Card>
      </div>
    </Container>
  );
}
