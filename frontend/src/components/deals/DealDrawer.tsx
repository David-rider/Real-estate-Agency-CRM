"use client";

import React from "react";
import { api, dateInputToISO, isoToDateInput } from "@/lib/api";
import { useExtra, fmt } from "@/lib/i18n/extra";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth/AuthContext";

const DATE_FIELDS = ["contractDate", "inspectionDate", "boardPackageDate", "clearToCloseDate", "closingDate"] as const;
type DateField = (typeof DATE_FIELDS)[number];
const INPUT = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none disabled:opacity-60";

/**
 * Deal detail panel: key dates as a timeline, the closing checklist, the commission rate
 * and the co-agent with their share of the agent-side commission.
 */
export default function DealDrawer({ dealId, onClose, onSaved }: { dealId: string; onClose: () => void; onSaved: () => void }) {
  const X = useExtra();
  const D = X.deals;
  const toast = useToast();
  const { user } = useAuth();
  const [deal, setDeal] = React.useState<any>(null);
  const [team, setTeam] = React.useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const d = await api(`/api/transactions/${dealId}`);
      setDeal(d);
      const f: Record<string, string> = {
        commissionRate: d.commissionRate == null ? "" : String(d.commissionRate),
        coAgentId: d.coAgentId ?? "",
        coAgentSplit: d.coAgentSplit == null ? "" : String(d.coAgentSplit),
      };
      for (const k of DATE_FIELDS) f[k] = isoToDateInput(d[k]);
      setForm(f);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : X.common.error);
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  React.useEffect(() => {
    load();
    api("/api/settings/team").then((t) => setTeam(Array.isArray(t) ? t : [])).catch(() => setTeam([]));
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        commissionRate: form.commissionRate === "" ? null : Number(form.commissionRate),
        coAgentId: form.coAgentId || null,
        coAgentSplit: form.coAgentId ? (form.coAgentSplit === "" ? null : Number(form.coAgentSplit)) : null,
      };
      for (const k of DATE_FIELDS) body[k] = dateInputToISO(form[k]);
      await api(`/api/transactions/${dealId}`, { method: "PATCH", body });
      toast.success(D.saved);
      onSaved();
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : X.common.error);
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (task: any) => {
    try {
      await api(`/api/tasks/${task.id}`, { method: "PATCH", body: { status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED" } });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : X.common.error);
    }
  };

  const relative = (iso: string) => {
    if (!iso) return "";
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const day = new Date(`${iso}T00:00:00`);
    const n = Math.round((day.getTime() - today.getTime()) / 86400000);
    if (n === 0) return D.today;
    // A milestone date in the past has happened; it is not "overdue"
    return n > 0 ? fmt(D.daysLeft, { n }) : fmt(D.daysAgo, { n: -n });
  };

  const editable = !!deal?.canEdit;
  const agentName = (id: string) => (id === deal?.agentId ? deal?.agent?.name : team.find((m) => m.id === id)?.name) ?? "—";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <aside className="w-full max-w-xl h-full overflow-y-auto bg-surface border-l border-border p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{deal?.property?.address ?? "…"}</h2>
            {deal && <p className="text-sm text-foreground/60">{deal.client?.firstName} {deal.client?.lastName} · ${Number(deal.acceptedPrice ?? deal.price).toLocaleString()}</p>}
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-foreground/50 hover:text-foreground" aria-label={D.close}>&times;</button>
        </div>

        {!deal ? <p className="text-sm text-foreground/50">{X.common.loading}</p> : (
          <>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3">{D.timeline}</h3>
              <ol className="space-y-3 border-l border-border pl-4">
                {DATE_FIELDS.map((k: DateField) => {
                  const rel = relative(form[k]);
                  const past = !!form[k] && new Date(`${form[k]}T00:00:00`) < new Date(new Date().toDateString());
                  return (
                    <li key={k} className="relative">
                      <span className={`absolute -left-[21px] top-2 w-2.5 h-2.5 rounded-full ${form[k] ? (past ? "bg-foreground/30" : "bg-primary") : "bg-border"}`} />
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm text-foreground">{D[k]}</label>
                        <div className="flex items-center gap-2">
                          {rel && <span className="text-xs text-foreground/50">{rel}</span>}
                          <input type="date" value={form[k] ?? ""} disabled={!editable} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={`${INPUT} w-40`} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground/40">{D.commission}</h3>
              <div>
                <label className="block text-sm text-foreground mb-1">{D.commissionRate}</label>
                <input type="number" min={0} max={100} step="0.01" value={form.commissionRate ?? ""} disabled={!editable} placeholder={D.commissionRateHint} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-foreground mb-1">{D.coAgent}</label>
                  <select value={form.coAgentId ?? ""} disabled={!editable} onChange={(e) => setForm({ ...form, coAgentId: e.target.value })} className={INPUT}>
                    <option value="">{D.none}</option>
                    {team.filter((m) => m.id !== deal.agentId).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1">{D.coAgentSplit}</label>
                  <input type="number" min={0} max={100} value={form.coAgentSplit ?? ""} disabled={!editable || !form.coAgentId} placeholder="50" onChange={(e) => setForm({ ...form, coAgentSplit: e.target.value })} className={INPUT} />
                </div>
              </div>
              <p className="text-xs text-foreground/50">{D.coAgentSplitHint}</p>
              {deal.commissions?.length > 0 && (
                <ul className="text-sm space-y-1">
                  {deal.commissions.map((c: any) => (
                    <li key={c.id} className="flex justify-between"><span>{agentName(c.agentId)}</span><span>${Number(c.netPayout).toLocaleString()} · {D.commissionStatus[c.status] ?? c.status}</span></li>
                  ))}
                </ul>
              )}
            </section>

            {editable && (
              <button onClick={save} disabled={saving} className="w-full py-2.5 bg-primary text-background rounded-lg text-sm font-medium disabled:opacity-60">{saving ? "…" : D.save}</button>
            )}

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3">{D.checklist}</h3>
              {deal.checklist?.length ? (
                <ul className="space-y-2">
                  {deal.checklist.map((task: any) => (
                    <li key={task.id} className="flex items-start gap-3 text-sm">
                      <input type="checkbox" checked={task.status === "COMPLETED"} disabled={task.agentId !== user?.id} title={task.agentId !== user?.id ? D.onlyOwner : undefined} onChange={() => toggleTask(task)} className="mt-0.5 disabled:opacity-50" />
                      <div className="flex-1">
                        <div className={task.status === "COMPLETED" ? "line-through text-foreground/40" : "text-foreground"}>{task.title}</div>
                        {task.dueDate && <div className="text-xs text-foreground/40">{isoToDateInput(task.dueDate)}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-foreground/50">{D.noChecklist}</p>}
            </section>
          </>
        )}
      </aside>
    </div>
  );
}
