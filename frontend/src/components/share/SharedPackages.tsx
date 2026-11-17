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

// The "Shared packages" tab of the Documents page: links, how often they were opened, revoke and delete
export default function SharedPackages() {
  const X = useExtra();
  const S = X.share;
  const toast = useToast();
  const [rows, setRows] = useState<Pkg[] | null>(null);

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
            <button
              onClick={() => window.confirm(S.confirmDelete) && act(() => api(`/api/shares/${p.id}`, { method: "DELETE" }))}
              className="text-xs uppercase tracking-widest text-foreground/40 hover:text-red-500"
            >
              {S.deletePackage}
            </button>
          </div>
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
