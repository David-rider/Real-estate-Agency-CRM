"use client";

import React from "react";
import { api } from "@/lib/api";
import { useExtra } from "@/lib/i18n/extra";
import { useToast } from "@/components/ui/Toast";

/**
 * "Sync with Google Calendar" (subscription link): a private ICS link of the user's own appointments that
 * Google Calendar (or Apple / Outlook) subscribes to. The link is only shown right after it is created.
 */
export default function CalendarFeedModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const X = useExtra();
  const C = X.calFeed;
  const toast = useToast();
  const [active, setActive] = React.useState<boolean | null>(null);
  const [url, setUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setUrl("");
    api("/api/settings/calendar-feed").then((r) => setActive(!!r.active)).catch(() => setActive(false));
  }, [open]);

  if (!open) return null;

  const create = async () => {
    setBusy(true);
    try { const r = await api("/api/settings/calendar-feed", { method: "POST" }); setUrl(r.url); setActive(true); }
    catch (err) { toast.error(err instanceof Error ? err.message : X.common.error); }
    finally { setBusy(false); }
  };
  const revoke = async () => {
    if (!window.confirm(C.revokeConfirm)) return;
    setBusy(true);
    try { await api("/api/settings/calendar-feed", { method: "DELETE" }); setUrl(""); setActive(false); toast.success(C.revoked); }
    catch (err) { toast.error(err instanceof Error ? err.message : X.common.error); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast.success(C.copied); } catch { /* the field stays selectable */ }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
      <div className="bg-background border border-border shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface">
          <h2 className="text-xl font-semibold text-foreground">{C.title}</h2>
          <button onClick={onClose} aria-label={C.close} className="text-foreground/50 hover:text-primary text-3xl leading-none">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-foreground/80">
          <p>{C.intro}</p>

          {url ? (
            <div className="space-y-2">
              <div className="text-xs text-foreground/50">{C.yourLink}</div>
              <div className="flex gap-2">
                <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="flex-1 min-w-0 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-foreground font-mono" />
                <button onClick={copy} className="px-3 py-2 bg-primary text-background rounded-lg text-xs font-semibold">{C.copy}</button>
              </div>
              <p className="text-xs text-amber-500">{C.keepPrivate}</p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={create} disabled={busy || active === null} className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-semibold disabled:opacity-50">
                {active ? C.newLink : C.create}
              </button>
              {active && <span className="text-xs text-foreground/50">{C.activeHint}</span>}
            </div>
          )}

          <div>
            <div className="font-semibold text-foreground mb-2">{C.howTitle}</div>
            <ol className="list-decimal pl-5 space-y-1">
              {C.steps.map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ol>
          </div>
          <p className="text-xs text-foreground/50">{C.note}</p>

          {active && (
            <button onClick={revoke} disabled={busy} className="text-xs text-red-500 hover:underline disabled:opacity-50">{C.revoke}</button>
          )}
        </div>
      </div>
    </div>
  );
}
