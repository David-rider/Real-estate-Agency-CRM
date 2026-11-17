"use client";

import React, { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useExtra, fmt } from "@/lib/i18n/extra";
import { useToast } from "@/components/ui/Toast";
import { copyLink } from "./ShareDialog";

type Link = {
  id: string; token: string; recipientEmail: string | null; active: boolean; revokedAt: string | null;
  expiresAt: string | null; viewCount: number; lastViewedAt: string | null; createdAt: string;
};
type Pkg = {
  id: string; title: string; createdAt: string; createdBy: { id: string; name: string | null };
  documents: { id: string; name: string }[]; links: Link[];
};

type View = { id: string; viewerEmail: string | null; ndaAcceptedAt: string | null; startedAt: string; totalSeconds: number; pages: Record<string, Record<string, number>> | null };
type Detail = { documents: { id: string; name: string }[]; links: (Link & { views: View[] })[] };

// Who opened each link, when, and how long they spent on every page
function PackageStats({ id }: { id: string }) {
  const X = useExtra();
  const S = X.share;
  const [d, setD] = useState<Detail | null>(null);
  useEffect(() => { api<Detail>(`/api/shares/${id}`).then(setD).catch(() => setD(null)); }, [id]);
  if (!d) return <p className="text-xs text-foreground/40 py-2">{X.ui.loading}</p>;
  const dur = (t: number) => (t >= 60 ? fmt(S.minSec, { m: Math.floor(t / 60), s: t % 60 }) : fmt(S.sec, { s: t }));
  const views = d.links.flatMap((l) => l.views);
  if (!views.length) return <p className="text-xs text-foreground/50 py-2">{S.noViews}</p>;
  return (
    <div className="space-y-4 py-3">
      {views.map((v) => (
        <div key={v.id} className="border border-border p-3 text-sm">
          <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
            <span className="font-medium">{v.viewerEmail || S.anonymous}</span>
            <span className="text-foreground/50 text-xs">{new Date(v.startedAt).toLocaleString()}</span>
            <span className="text-foreground/50 text-xs">{fmt(S.totalTime, { t: dur(v.totalSeconds) })}</span>
            {v.ndaAcceptedAt && <span className="text-xs text-primary">{S.ndaAccepted}</span>}
          </div>
          {d.documents.map((doc) => {
            const pages = v.pages?.[doc.id];
            if (!pages) return null;
            const entries = Object.entries(pages).map(([p, t]) => [Number(p), t] as const).sort((a, b) => a[0] - b[0]);
            const max = Math.max(...entries.map((e) => e[1]), 1);
            return (
              <div key={doc.id} className="mt-2">
                <p className="text-xs text-foreground/60 mb-1">{doc.name}</p>
                <div className="space-y-1">
                  {entries.map(([p, t]) => (
                    <div key={p} className="flex items-center gap-2 text-xs">
                      <span className="w-16 shrink-0 text-foreground/50">{fmt(S.vPage, { n: p })}</span>
                      <div className="flex-1 h-2 bg-surface"><div className="h-2 bg-primary" style={{ width: `${(t / max) * 100}%` }} /></div>
                      <span className="w-20 shrink-0 text-right text-foreground/60">{dur(t)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// The "Shared packages" tab of the Documents page: links, how often they were opened, revoke and delete
export default function SharedPackages() {
  const X = useExtra();
  const S = X.share;
  const toast = useToast();
  const [rows, setRows] = useState<Pkg[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Pkg[]>("/api/shares").then(setRows).catch(() => setRows([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    try { await fn(); load(); } catch (err) { toast.error(err instanceof Error ? err.message : X.common.error); }
  };

  if (!rows) return <p className="p-12 text-center text-foreground/40 text-sm">{X.ui.loading}</p>;
  if (!rows.length) return <p className="p-12 text-center text-foreground/50 text-sm bg-surface border border-border">{S.noPackages}</p>;

  const status = (l: Link) => (l.revokedAt ? S.revoked : l.active ? S.active : S.expired);

  return (
    <div className="space-y-4">
      {rows.map((p) => (
        <div key={p.id} className="bg-background border border-border p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-serif text-lg">{p.title}</h3>
              <p className="text-xs text-foreground/50">
                {fmt(S.documentsCount, { n: p.documents.length })} · {new Date(p.createdAt).toLocaleDateString()}
                {p.createdBy.name ? ` · ${fmt(S.by, { name: p.createdBy.name })}` : ""}
              </p>
              <p className="text-xs text-foreground/50 mt-1 truncate">{p.documents.map((d) => d.name).join(", ")}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setOpen(open === p.id ? null : p.id)} className="text-xs uppercase tracking-widest text-primary">
                {open === p.id ? S.hideDetails : S.details}
              </button>
              <button
                onClick={() => window.confirm(S.confirmDelete) && act(() => api(`/api/shares/${p.id}`, { method: "DELETE" }))}
                className="text-xs uppercase tracking-widest text-foreground/40 hover:text-red-500"
              >
                {S.deletePackage}
              </button>
            </div>
          </div>
          {open === p.id && <PackageStats id={p.id} />}
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {p.links.map((l) => (
              <li key={l.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span className={`text-xs px-2 py-0.5 border ${l.active ? "border-primary/40 text-primary" : "border-border text-foreground/40"}`}>{status(l)}</span>
                  {l.recipientEmail && <span className="ml-2 text-foreground/70">{fmt(S.forRecipient, { email: l.recipientEmail })}</span>}
                  <span className="ml-2 text-foreground/50">
                    {l.viewCount ? fmt(S.views, { n: l.viewCount }) : S.neverViewed}
                    {l.lastViewedAt ? ` · ${fmt(S.lastViewed, { date: new Date(l.lastViewedAt).toLocaleString() })}` : ""}
                  </span>
                </div>
                {l.active && (
                  <div className="flex gap-4">
                    <button onClick={() => copyLink(l.token, S.copied, X.common.error, toast)} className="text-xs uppercase tracking-widest text-primary">{S.copy}</button>
                    <button
                      onClick={() => window.confirm(S.confirmRevoke) && act(() => api(`/api/shares/links/${l.id}`, { method: "PATCH", body: { revoked: true } }))}
                      className="text-xs uppercase tracking-widest text-foreground/40 hover:text-red-500"
                    >
                      {S.revoke}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
