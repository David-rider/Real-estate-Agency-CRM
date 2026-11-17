"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api, dateInputToISO } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useExtra } from "@/lib/i18n/extra";
import { useToast } from "@/components/ui/Toast";

type Doc = { id: string; name: string };
type Ref = { id: string; label: string };

export const shareUrl = (token: string) => `${window.location.origin}/share?t=${token}`;

export async function copyLink(token: string, done: string, fail: string, toast: ReturnType<typeof useToast>) {
  try {
    await navigator.clipboard.writeText(shareUrl(token));
    toast.success(done);
  } catch {
    toast.error(fail);
  }
}

const inputCls = "w-full px-3 py-2 bg-surface border border-border text-sm text-foreground outline-none focus:border-primary";

// Creates a package from the documents ticked on the Documents page, with its first link (Elite)
export default function ShareDialog({ docs, onClose, onCreated }: { docs: Doc[]; onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const X = useExtra();
  const S = X.share;
  const toast = useToast();
  const isElite = user?.tier === "ELITE" || user?.role === "SUPERADMIN";

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [linkKind, setLinkKind] = useState<"" | "property" | "client">("");
  const [refId, setRefId] = useState("");
  const [refs, setRefs] = useState<Ref[]>([]);
  const [requireEmail, setRequireEmail] = useState(true);
  const [watermark, setWatermark] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);
  const [requireNda, setRequireNda] = useState(false);
  const [ndaText, setNdaText] = useState("");
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setRefId("");
    if (!linkKind) return setRefs([]);
    const path = linkKind === "property" ? "/api/properties" : "/api/clients";
    api<any>(path)
      .then((r) => {
        const rows: any[] = Array.isArray(r) ? r : r?.data || [];
        setRefs(rows.map((x) => ({ id: x.id, label: linkKind === "property" ? x.address : `${x.firstName ?? ""} ${x.lastName ?? ""}`.trim() })));
      })
      .catch(() => setRefs([]));
  }, [linkKind]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ link: { token: string } }>("/api/shares", {
        method: "POST",
        body: {
          title, message, documentIds: docs.map((d) => d.id),
          propertyId: linkKind === "property" ? refId || undefined : undefined,
          clientId: linkKind === "client" ? refId || undefined : undefined,
          recipientEmail: recipientEmail.trim() || undefined,
          requireEmail, watermark, allowDownload, requireNda,
          ndaText: requireNda ? ndaText : undefined,
          expiresAt: expires ? dateInputToISO(expires, true) : undefined,
        },
      });
      setToken(r.link.token);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : X.common.error);
    } finally {
      setBusy(false);
    }
  };

  const check = (label: string, value: boolean, set: (v: boolean) => void) => (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} className="mt-0.5" />
      <span>{label}</span>
    </label>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
      <div className="bg-background border border-border shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface">
          <h2 className="font-serif text-2xl font-light">{S.dialogTitle}</h2>
          <button onClick={onClose} aria-label={S.close} className="text-foreground/50 hover:text-primary text-3xl leading-none">&times;</button>
        </div>

        {!isElite ? (
          <div className="p-6 space-y-4">
            <p className="text-sm">{S.eliteOnly}</p>
            <Link href="/upgrade" className="inline-block px-4 py-2 bg-primary text-background text-sm font-medium">{S.upgrade}</Link>
          </div>
        ) : token ? (
          <div className="p-6 space-y-4">
            <p className="text-sm">{S.linkReady}</p>
            <input readOnly value={shareUrl(token)} className={inputCls} onFocus={(e) => e.target.select()} />
            <div className="flex gap-3">
              <button onClick={() => copyLink(token, S.copied, X.common.error, toast)} className="px-4 py-2 bg-primary text-background text-sm font-medium">{S.copy}</button>
              <button onClick={onClose} className="px-4 py-2 border border-border text-sm">{S.close}</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto">
            <ul className="text-sm text-foreground/70 list-disc pl-5">{docs.map((d) => <li key={d.id}>{d.name}</li>)}</ul>
            <label className="block text-sm">{S.title}
              <input required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={S.phTitle} className={`${inputCls} mt-1`} />
            </label>
            <label className="block text-sm">{S.message}
              <textarea maxLength={2000} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className={`${inputCls} mt-1`} />
            </label>
            <label className="block text-sm">{S.recipient}
              <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} className={`${inputCls} mt-1`} />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-sm">{S.linkTo}
                <select value={linkKind} onChange={(e) => setLinkKind(e.target.value as any)} className={`${inputCls} mt-1`}>
                  <option value="">{S.noLink}</option>
                  <option value="property">{S.listing}</option>
                  <option value="client">{S.client}</option>
                </select>
              </label>
              {linkKind && (
                <label className="block text-sm">{linkKind === "property" ? S.listing : S.client}
                  <select value={refId} onChange={(e) => setRefId(e.target.value)} className={`${inputCls} mt-1`}>
                    <option value="">—</option>
                    {refs.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </label>
              )}
            </div>
            <div className="space-y-2">
              {check(S.requireEmail, requireEmail, setRequireEmail)}
              {check(S.watermark, watermark, setWatermark)}
              {check(S.allowDownload, allowDownload, setAllowDownload)}
              {check(S.requireNda, requireNda, setRequireNda)}
            </div>
            {requireNda && (
              <label className="block text-sm">{S.ndaText}
                <textarea required rows={6} value={ndaText} onChange={(e) => setNdaText(e.target.value)} className={`${inputCls} mt-1`} />
                <span className="block text-xs text-foreground/50 mt-1">{S.ndaHint}</span>
              </label>
            )}
            <label className="block text-sm">{S.expires}
              <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={`${inputCls} mt-1`} />
            </label>
            <p className="text-xs text-foreground/50">{S.deterrentNote}</p>
            <button type="submit" disabled={busy} className="px-5 py-2 bg-primary text-background text-sm font-medium disabled:opacity-50">{busy ? S.creating : S.create}</button>
          </form>
        )}
      </div>
    </div>
  );
}
