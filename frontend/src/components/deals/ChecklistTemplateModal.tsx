"use client";

import React from "react";
import { api } from "@/lib/api";
import { useExtra } from "@/lib/i18n/extra";
import { useToast } from "@/components/ui/Toast";

type Item = { title: string; anchor: "CONTRACT" | "CLOSING"; offsetDays: number; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" };
const INPUT = "px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none";

/**
 * Editor for the brokerage's own contract-to-close checklist. New deals get these tasks;
 * existing deals keep the checklist they were opened with.
 */
export default function ChecklistTemplateModal({ onClose }: { onClose: () => void }) {
  const X = useExtra();
  const C = X.deals.template;
  const toast = useToast();
  const [items, setItems] = React.useState<Item[]>([]);
  const [isStandard, setIsStandard] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    api("/api/settings/checklist-template")
      .then((r) => { setItems(r.items); setIsStandard(r.isStandard); })
      .catch((err) => toast.error(err instanceof Error ? err.message : X.common.error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (i: number, patch: Partial<Item>) => setItems(items.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };

  const save = async (reset = false) => {
    setSaving(true);
    try {
      const r = await api("/api/settings/checklist-template", { method: "PUT", body: { items: reset ? null : items } });
      setItems(r.items);
      setIsStandard(r.isStandard);
      toast.success(reset ? C.resetDone : C.saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : X.common.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{C.title}</h2>
            <p className="text-sm text-foreground/60">{C.desc}</p>
            <p className="text-xs text-foreground/50 mt-1">{isStandard ? C.usingStandard : C.usingCustom}</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-foreground/50 hover:text-foreground" aria-label={X.deals.close}>&times;</button>
        </div>

        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 border-b border-border/50 pb-2">
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-xs text-foreground/50 disabled:opacity-30" aria-label={C.moveUp}>▲</button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-xs text-foreground/50 disabled:opacity-30" aria-label={C.moveDown}>▼</button>
              </div>
              <input value={it.title} onChange={(e) => update(i, { title: e.target.value })} placeholder={C.itemTitle} className={`${INPUT} flex-1 min-w-[220px]`} />
              <input type="number" value={it.offsetDays} onChange={(e) => update(i, { offsetDays: Math.round(Number(e.target.value)) })} className={`${INPUT} w-20`} aria-label={C.days} />
              <select value={it.anchor} onChange={(e) => update(i, { anchor: e.target.value as Item["anchor"] })} className={INPUT} aria-label={C.relativeTo}>
                <option value="CONTRACT">{C.daysFromContract}</option>
                <option value="CLOSING">{C.daysFromClosing}</option>
              </select>
              <select value={it.priority} onChange={(e) => update(i, { priority: e.target.value as Item["priority"] })} className={INPUT} aria-label={C.priority}>
                {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((p) => <option key={p} value={p}>{C.priorities[p]}</option>)}
              </select>
              <button onClick={() => setItems(items.filter((_, k) => k !== i))} className="text-sm text-red-500 hover:underline">{C.remove}</button>
            </div>
          ))}
        </div>
        <p className="text-xs text-foreground/50">{C.daysHint}</p>

        <div className="flex flex-wrap gap-2 justify-between">
          <button onClick={() => setItems([...items, { title: "", anchor: "CONTRACT", offsetDays: 7, priority: "MEDIUM" }])} disabled={items.length >= 40} className="px-3 py-2 border border-border rounded-lg text-sm">{C.add}</button>
          <div className="flex gap-2">
            {!isStandard && <button onClick={() => save(true)} disabled={saving} className="px-3 py-2 border border-border rounded-lg text-sm">{C.reset}</button>}
            <button onClick={() => save(false)} disabled={saving} className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium disabled:opacity-60">{saving ? "…" : C.save}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
