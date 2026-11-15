"use client";

import React, { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/I18nContext";
import { useExtra, fmt } from "@/lib/i18n/extra";
import { useToast } from "@/components/ui/Toast";

type Level = "PRO" | "ELITE";
type CompanyBillingData = {
  active: boolean;
  plan: Level | null;
  seats: { PRO: number; ELITE: number };
  members: { id: string; name: string; email: string; level: Level; paysForSelf: boolean }[];
};

// Firm admins: let the brokerage pay for every internal member on one invoice, with a level per member.
export default function CompanyBilling({ billingCycle }: { billingCycle: "monthly" | "annual" }) {
  const { t } = useI18n();
  const UX = useExtra().upgradeExtra;
  const toast = useToast();
  const [data, setData] = useState<CompanyBillingData | null>(null);
  const [plan, setPlan] = useState<Level>("PRO");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<CompanyBillingData>("/api/payments/company").then(setData).catch(() => setData(null));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!data) return null;
  const levelName = (l: Level) => (l === "ELITE" ? t.upgrade.elite.name : t.upgrade.pro.name);
  const fail = (err: unknown) => toast.error((err as Error)?.message || t.upgrade.checkout.sessionExpired);

  const start = async () => {
    setBusy(true);
    try {
      const { url } = await api<{ url: string }>("/api/payments/company/checkout", { method: "POST", body: { plan, cycle: billingCycle === "annual" ? "ANNUAL" : "MONTHLY" } });
      window.location.href = url;
    } catch (err) { fail(err); setBusy(false); }
  };
  const openPortal = async () => {
    setBusy(true);
    try {
      const { url } = await api<{ url: string }>("/api/payments/company/portal");
      window.location.href = url;
    } catch (err) { fail(err); setBusy(false); }
  };
  const setLevel = async (id: string, level: Level) => {
    try {
      await api(`/api/payments/company/members/${id}`, { method: "PATCH", body: { level } });
      toast.success(UX.levelSaved);
      load();
    } catch (err) { fail(err); }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 mt-16">
      <div className="p-6 rounded-xl border border-border bg-surface">
        <h3 className="font-sans font-medium text-xl mb-2">{UX.companyTitle}</h3>
        <p className="text-sm text-foreground/60 leading-relaxed">{UX.companyDesc}</p>

        {data.active ? (
          <>
            <p className="mt-4 text-sm font-medium text-primary">{fmt(UX.companyActive, { pro: data.seats.PRO, elite: data.seats.ELITE })}</p>
            <ul className="mt-4 divide-y divide-border">
              {data.members.map((m) => (
                <li key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="text-xs text-foreground/50 truncate">{m.email}</div>
                  </div>
                  <select
                    value={m.level}
                    onChange={(e) => setLevel(m.id, e.target.value as Level)}
                    aria-label={UX.levelFor}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="PRO">{levelName("PRO")}</option>
                    <option value="ELITE">{levelName("ELITE")}</option>
                  </select>
                </li>
              ))}
            </ul>
            <button onClick={openPortal} disabled={busy} className="mt-4 px-5 py-2 rounded-full border border-border text-sm hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
              {UX.companyManage}
            </button>
          </>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="text-sm text-foreground/60" htmlFor="company-plan">{UX.levelFor}</label>
            <select id="company-plan" value={plan} onChange={(e) => setPlan(e.target.value as Level)} className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm">
              <option value="PRO">{levelName("PRO")}</option>
              <option value="ELITE">{levelName("ELITE")}</option>
            </select>
            <button onClick={start} disabled={busy} className="px-5 py-2 rounded-full bg-primary text-background text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {fmt(UX.companyStart, { n: data.members.length })}
            </button>
          </div>
        )}
        <p className="mt-4 text-xs text-foreground/50 leading-relaxed">{UX.companyNote}</p>
      </div>
    </div>
  );
}
