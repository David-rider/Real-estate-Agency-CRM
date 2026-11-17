"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nContext";
import { useExtra, fmt } from "@/lib/i18n/extra";
import { api } from "@/lib/api";
import SharedFile from "@/components/share/SharedFile";

type Info = {
  brokerage: { name: string; logoUrl: string | null };
  title: string;
  message: string | null;
  documents: { id: string; name: string; mimeType: string | null }[];
  requireEmail: boolean;
  requireNda: boolean;
  ndaText: string | null;
  watermark: boolean;
  allowDownload: boolean;
};
type SharedDoc = { id: string; name: string; mimeType: string | null; url: string; downloadUrl: string | null };

const kindOf = (f: { name: string; mimeType: string | null }): "pdf" | "image" | null => {
  const m = (f.mimeType || "").toLowerCase();
  if (m === "application/pdf" || /\.pdf$/i.test(f.name)) return "pdf";
  if (m.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(f.name)) return "image";
  return null;
};

/**
 * Public viewer of a shared document package (/share?t=<token>). No account needed: the viewer passes the
 * link's gate (email / confidentiality agreement), then sees the documents with their email as a watermark.
 */
function ShareViewer() {
  const token = useSearchParams().get("t") ?? "";
  const { language, setLanguage } = useI18n();
  const S = useExtra().share;

  const [info, setInfo] = useState<Info | null>(null);
  const [missing, setMissing] = useState(false);
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<string | null>(null);
  const [files, setFiles] = useState<SharedDoc[]>([]);
  const [mark, setMark] = useState<string | null>(null);

  const open = useCallback(async (body: { email?: string; ndaAccepted?: boolean }, i: Info) => {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ session: string; files: SharedDoc[] }>(`/api/public/shares/${token}/view`, { method: "POST", body, auth: false });
      setSession(r.session);
      setFiles(r.files);
      setMark(i.watermark ? `${body.email || i.brokerage.name} · ${new Date().toLocaleString()}` : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) { setMissing(true); return; }
    api<Info>(`/api/public/shares/${token}`, { auth: false })
      .then((i) => {
        setInfo(i);
        // Nothing to ask: open straight away
        if (!i.requireEmail && !i.requireNda) open({}, i);
      })
      .catch(() => setMissing(true));
  }, [token, open]);

  // A fresh address for one file once the 10-minute one has expired
  const refresh = useCallback(async (id: string) => {
    if (!session) return null;
    try {
      const r = await api<{ files: SharedDoc[] }>(`/api/public/shares/${token}/files`, { method: "POST", body: { session }, auth: false });
      setFiles(r.files);
      return r.files.find((f) => f.id === id)?.url ?? null;
    } catch {
      return null;
    }
  }, [session, token]);

  const langSelect = (
    <select value={language} onChange={(e) => setLanguage(e.target.value as any)} className="bg-transparent border border-border text-xs rounded-lg px-2.5 py-1 outline-none cursor-pointer">
      <option value="en">EN</option><option value="zh-CN">简体</option><option value="zh-TW">繁體</option><option value="es">ES</option>
    </select>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {info?.brokerage.logoUrl && <img src={info.brokerage.logoUrl} alt={info.brokerage.name} className="h-8 w-auto" />}
            <span className="text-sm text-foreground/70 truncate">{info ? fmt(S.vFrom, { brokerage: info.brokerage.name }) : ""}</span>
          </div>
          {langSelect}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {missing ? (
          <p className="text-center text-foreground/60 py-20">{S.vNotFound}</p>
        ) : !info ? (
          <p className="text-center text-foreground/40 py-20">{S.vLoading}</p>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">{info.title}</h1>
            {info.message && <p className="text-foreground/70 whitespace-pre-line mb-6">{info.message}</p>}

            {!session ? (
              <form
                className="max-w-lg space-y-4 mt-6 p-6 border border-border rounded-xl bg-surface"
                onSubmit={(e) => { e.preventDefault(); open({ email: email.trim() || undefined, ndaAccepted: accepted }, info); }}
              >
                <ul className="text-sm text-foreground/70 list-disc pl-5">
                  {info.documents.map((d) => <li key={d.id}>{d.name}</li>)}
                </ul>
                {info.requireEmail && (
                  <label className="block">
                    <span className="block text-sm mb-1">{S.vEmail}</span>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary" />
                  </label>
                )}
                {info.requireNda && (
                  <div>
                    <p className="text-sm font-medium mb-1">{S.vNdaTitle}</p>
                    <div className="max-h-56 overflow-y-auto whitespace-pre-line text-sm text-foreground/80 p-3 border border-border rounded-lg bg-background">{info.ndaText}</div>
                    <label className="flex items-center gap-2 mt-2 text-sm">
                      <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required />
                      {S.vNdaAccept}
                    </label>
                  </div>
                )}
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button type="submit" disabled={busy} className="px-5 py-2 rounded-lg bg-primary text-background font-medium disabled:opacity-50">{S.vOpen}</button>
              </form>
            ) : (
              <div className="space-y-10 mt-6">
                {info.watermark && info.allowDownload && <p className="text-xs text-foreground/50">{S.vNoWatermark}</p>}
                {files.map((f) => {
                  const kind = kindOf(f);
                  return (
                    <section key={f.id} className="space-y-3">
                      <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
                        <h2 className="font-medium truncate">{f.name}</h2>
                        {f.downloadUrl && <a href={f.downloadUrl} className="text-sm text-primary hover:underline whitespace-nowrap">{S.vDownload}</a>}
                      </div>
                      {kind ? (
                        <SharedFile url={f.url} kind={kind} watermark={mark} pageLabel={(n) => fmt(S.vPage, { n })} errorText={S.vPdfError} refreshUrl={() => refresh(f.id)} />
                      ) : f.downloadUrl ? (
                        <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{S.vOpenFile}</a>
                      ) : (
                        <p className="text-sm text-foreground/60">{S.vPdfError}</p>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Static export: the token comes from the query string (?t=), read inside a Suspense boundary
export default function ShareViewerRoute() {
  return (
    <Suspense fallback={null}>
      <ShareViewer />
    </Suspense>
  );
}
