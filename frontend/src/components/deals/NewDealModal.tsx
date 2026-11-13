"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { useExtra } from "@/lib/i18n/extra";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";

type Opt = { id: string; label: string };
const FIELD = "w-full px-4 py-3 bg-surface border border-border text-base text-foreground focus:border-primary outline-none transition-colors";
const LABEL = "block font-sans text-sm uppercase tracking-widest text-foreground/50 mb-2";

/** Create a deal (transaction) in place — used by the pipeline board and the transactions page. */
export default function NewDealModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { t } = useI18n();
  const X = useExtra();
  const toast = useToast();
  const M = t.transactions.modal;
  const [props, setProps] = React.useState<Opt[]>([]);
  const [clients, setClients] = React.useState<Opt[]>([]);
  const [form, setForm] = React.useState({ propertyId: "", clientId: "", price: "", status: "OFFER_REVIEW" });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setForm({ propertyId: "", clientId: "", price: "", status: "OFFER_REVIEW" });
    api("/api/properties?limit=100").then((d) => setProps((d.data || []).map((p: { id: string; address: string }) => ({ id: p.id, label: p.address })))).catch(() => setProps([]));
    api("/api/clients?limit=100").then((d) => setClients((d.data || []).map((c: { id: string; firstName: string; lastName: string; type: string }) => ({
      id: c.id, label: `${c.firstName} ${c.lastName} (${(X.ui.clientTypes as Record<string, string>)[c.type] ?? c.type})`,
    })))).catch(() => setClients([]));
  }, [open, X.ui.clientTypes]);

  if (!open) return null;
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/transactions", { method: "POST", body: { ...form, price: Number(form.price) } });
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : X.common.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="bg-background border border-border shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-border flex justify-between items-center bg-surface">
          <h2 className="font-serif text-3xl font-light text-foreground">{M.title}</h2>
          <button onClick={onClose} aria-label={M.cancel} className="text-foreground/50 hover:text-primary text-3xl font-light leading-none">&times;</button>
        </div>
        <form onSubmit={submit} className="p-8 overflow-y-auto space-y-8">
          <div>
            <label className={LABEL}>{M.selectProperty}</label>
            <select required value={form.propertyId} onChange={set("propertyId")} className={FIELD}>
              <option value="" disabled>{M.selectPropertyPlaceholder}</option>
              {props.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>{M.selectClient}</label>
            <select required value={form.clientId} onChange={set("clientId")} className={FIELD}>
              <option value="" disabled>{M.selectClientPlaceholder}</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={LABEL}>{M.offerPrice}</label>
              <input required type="number" min="0" value={form.price} onChange={set("price")} className={FIELD} />
            </div>
            <div>
              <label className={LABEL}>{M.initialStage}</label>
              <select value={form.status} onChange={set("status")} className={FIELD}>
                <option value="OFFER_REVIEW">{M.stageOffer}</option>
                <option value="IN_CONTRACT">{M.stageContract}</option>
                <option value="BOARD_PACKAGE">{M.stageBoard}</option>
                <option value="CLEARED_TO_CLOSE">{M.stageClose}</option>
              </select>
            </div>
          </div>
          <div className="pt-6 flex justify-end gap-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-6 py-3 border border-border text-foreground/70 uppercase tracking-widest hover:text-foreground">{M.cancel}</button>
            <button type="submit" disabled={saving} className="px-6 py-3 bg-primary text-background uppercase tracking-widest font-medium disabled:opacity-50">{saving ? M.saving : M.save}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
