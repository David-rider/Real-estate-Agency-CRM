"use client";

import React from "react";
import { api } from "@/lib/api";
import { useExtra, fmt } from "@/lib/i18n/extra";

type Perf = {
  periodStart: string;
  scope: "me" | "team";
  totals: { leads: number; closedDeals: number; closedVolume: number; avgDaysToClose: number | null };
  sources: { source: string; leads: number; closed: number; conversion: number }[];
  agents?: { agentId: string; name: string; newClients: number; closedDeals: number; closedVolume: number; grossCommission: number }[];
};

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

/** Fiscal-year performance: lead-source conversion, time to close and (managers) an agent comparison. */
export default function PerformanceTab() {
  const X = useExtra();
  const P = X.perf;
  const [data, setData] = React.useState<Perf | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    api("/api/reports/performance").then(setData).catch((e) => setError(e instanceof Error ? e.message : X.common.error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CSV with a UTF-8 byte-order mark: Excel opens it directly, Chinese and accents included
  const exportExcel = () => {
    if (!data) return;
    const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows: (string | number)[][] = [
      [P.source, P.leads, P.closed, `${P.conversion} (%)`],
      ...data.sources.map((s) => [s.source === "Unknown" ? P.unknownSource : s.source, s.leads, s.closed, s.conversion]),
    ];
    if (data.agents?.length) {
      rows.push([], [P.agent, P.newClients, P.closedDeals, P.closedVolume, P.grossCommission]);
      for (const a of data.agents) rows.push([a.name, a.newClients, a.closedDeals, Math.round(a.closedVolume), a.grossCommission]);
    }
    rows.push([], [P.closedDeals, data.totals.closedDeals], [P.closedVolume, Math.round(data.totals.closedVolume)], [P.avgDaysToClose, data.totals.avgDaysToClose ?? ""]);
    const csv = "﻿" + rows.map((r) => r.map(q).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!data) return <p className="text-sm text-foreground/50">{X.common.loading}</p>;

  const card = "bg-surface border border-border rounded-xl p-4";
  const th = "py-2 px-3 text-left text-xs uppercase tracking-wider text-foreground/50 font-medium";
  const td = "py-2 px-3 text-sm text-foreground";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-foreground/60">{fmt(P.since, { date: new Date(data.periodStart).toLocaleDateString() })} · {data.scope === "team" ? P.scopeTeam : P.scopeMe}</p>
        <button onClick={exportExcel} className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-foreground/70 hover:bg-surface-hover">{P.exportExcel}</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={card}><div className="text-xs text-foreground/50">{P.leads}</div><div className="text-2xl font-bold">{data.totals.leads}</div></div>
        <div className={card}><div className="text-xs text-foreground/50">{P.closedDeals}</div><div className="text-2xl font-bold">{data.totals.closedDeals}</div></div>
        <div className={card}><div className="text-xs text-foreground/50">{P.closedVolume}</div><div className="text-2xl font-bold">{money(data.totals.closedVolume)}</div></div>
        <div className={card}><div className="text-xs text-foreground/50">{P.avgDaysToClose}</div><div className="text-2xl font-bold">{data.totals.avgDaysToClose === null ? "—" : fmt(P.days, { n: data.totals.avgDaysToClose })}</div></div>
      </div>

      <div className={card}>
        <h3 className="text-sm font-semibold mb-3">{P.sourcesTitle}</h3>
        {data.sources.length === 0 ? <p className="text-sm text-foreground/50">{P.noData}</p> : (
          <table className="w-full">
            <thead><tr><th className={th}>{P.source}</th><th className={th}>{P.leads}</th><th className={th}>{P.closed}</th><th className={th}>{P.conversion}</th></tr></thead>
            <tbody>
              {data.sources.map((s) => (
                <tr key={s.source} className="border-t border-border/50">
                  <td className={td}>{s.source === "Unknown" ? P.unknownSource : s.source}</td><td className={td}>{s.leads}</td><td className={td}>{s.closed}</td><td className={td}>{s.conversion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data.agents && (
        <div className={card}>
          <h3 className="text-sm font-semibold mb-3">{P.agentsTitle}</h3>
          <table className="w-full">
            <thead><tr><th className={th}>{P.agent}</th><th className={th}>{P.newClients}</th><th className={th}>{P.closedDeals}</th><th className={th}>{P.closedVolume}</th><th className={th}>{P.grossCommission}</th></tr></thead>
            <tbody>
              {data.agents.map((a) => (
                <tr key={a.agentId} className="border-t border-border/50">
                  <td className={td}>{a.name}</td><td className={td}>{a.newClients}</td><td className={td}>{a.closedDeals}</td><td className={td}>{money(a.closedVolume)}</td><td className={td}>{money(a.grossCommission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
