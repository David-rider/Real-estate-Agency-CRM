"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useExtra, fmt } from "@/lib/i18n/extra";

// Shown on every signed-in page while a member is in the grace period (the date by which they need a paid plan)
// or while their brokerage's free Elite trial is running.
export default function BillingBanner() {
  const pathname = usePathname();
  const { user } = useAuth();
  const UX = useExtra().upgradeExtra;
  const [grace, setGrace] = useState<{ date: string; days: number; trial: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api<{ graceEndsAt: string | null; trialEndsAt?: string | null }>("/api/payments/status")
      .then((s) => {
        if (cancelled) return;
        const days = (end: Date) => Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
        if (s.trialEndsAt) {
          const end = new Date(s.trialEndsAt); // a moment, shown in the viewer's own time zone
          return setGrace({ date: end.toLocaleDateString(), days: days(end), trial: true });
        }
        if (!s.graceEndsAt) return setGrace(null);
        const end = new Date(s.graceEndsAt);
        setGrace({ date: end.toLocaleDateString(undefined, { timeZone: "UTC" }), days: days(end), trial: false });
      })
      .catch(() => { if (!cancelled) setGrace(null); });
    return () => { cancelled = true; };
  }, [user?.id, user?.tier]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!grace || pathname.startsWith("/upgrade")) return null;

  return (
    <div role="status" className="px-4 lg:px-8 py-2 bg-primary/10 text-primary text-sm flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-primary/20">
      <span>{fmt(grace.trial ? UX.trialBanner : UX.bannerText, { days: grace.days, date: grace.date })}</span>
      <Link href="/upgrade" className="font-medium underline whitespace-nowrap">{UX.bannerCta}</Link>
    </div>
  );
}
