"use client";

import React from "react";
import QRCode from "qrcode";
import { api } from "@/lib/api";
import { useExtra, fmt } from "@/lib/i18n/extra";
import { useToast } from "@/components/ui/Toast";

const INPUT = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none";
const BTN = "px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-foreground hover:bg-background";

type Stage = "idle" | "setup" | "codes" | "disable";

/** Settings → Security: turn two-factor authentication (authenticator app) on or off. */
export default function TwoFactorPanel() {
  const X = useExtra();
  const T = X.twoFactor;
  const toast = useToast();
  const [status, setStatus] = React.useState<{ enabled: boolean; recoveryCodesLeft: number } | null>(null);
  const [stage, setStage] = React.useState<Stage>("idle");
  const [secret, setSecret] = React.useState("");
  const [qr, setQr] = React.useState("");
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [codes, setCodes] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    api("/api/settings/2fa").then(setStatus).catch(() => setStatus(null));
  }, []);
  React.useEffect(load, [load]);

  const fail = (err: unknown) => toast.error(err instanceof Error ? err.message : X.common.error);
  const close = () => { setStage("idle"); setCode(""); setPassword(""); setSecret(""); setQr(""); };

  const startSetup = async () => {
    setBusy(true);
    try {
      const r = await api("/api/settings/2fa/setup", { method: "POST" });
      setSecret(r.secret);
      setQr(await QRCode.toDataURL(r.otpauthUrl, { width: 220, margin: 1 }));
      setStage("setup");
    } catch (err) { fail(err); } finally { setBusy(false); }
  };

  const enable = async () => {
    setBusy(true);
    try {
      const r = await api("/api/settings/2fa/enable", { method: "POST", body: { code } });
      setCodes(r.recoveryCodes);
      setStage("codes");
      setCode("");
      load();
    } catch (err) { fail(err); } finally { setBusy(false); }
  };

  const disable = async () => {
    setBusy(true);
    try {
      await api("/api/settings/2fa/disable", { method: "POST", body: { password, code } });
      toast.success(T.disabled);
      close();
      load();
    } catch (err) { fail(err); } finally { setBusy(false); }
  };

  if (!status) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        {status.enabled ? (
          <>
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-500 text-xs">{T.on}</span>
            <button className={BTN} onClick={() => setStage("disable")}>{T.turnOff}</button>
          </>
        ) : (
          <button className={BTN} onClick={startSetup} disabled={busy}>{T.setUp}</button>
        )}
      </div>
      {status.enabled && <p className="text-xs text-foreground/50 mt-1">{fmt(T.codesLeft, { n: status.recoveryCodesLeft })}</p>}

      {stage !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={stage === "codes" ? undefined : close}>
          <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            {stage === "setup" && (
              <>
                <h2 className="text-lg font-semibold text-foreground">{T.setupTitle}</h2>
                <p className="text-sm text-foreground/70">{T.step1}</p>
                {qr && <img src={qr} alt={T.qrAlt} className="mx-auto w-48 h-48 bg-white p-2 rounded" />}
                <p className="text-xs text-foreground/50">{T.manualKey}</p>
                <code className="block text-center text-sm tracking-widest break-all bg-background border border-border rounded p-2 select-all">{secret.match(/.{1,4}/g)?.join(" ")}</code>
                <p className="text-sm text-foreground/70">{T.step2}</p>
                <input className={INPUT} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" />
                <div className="flex justify-end gap-2">
                  <button className={BTN} onClick={close}>{T.cancel}</button>
                  <button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium disabled:opacity-60" disabled={busy || code.length !== 6} onClick={enable}>{T.confirm}</button>
                </div>
              </>
            )}
            {stage === "codes" && (
              <>
                <h2 className="text-lg font-semibold text-foreground">{T.codesTitle}</h2>
                <p className="text-sm text-foreground/70">{T.codesDesc}</p>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-background border border-border rounded p-3 select-all">
                  {codes.map((c) => <span key={c}>{c}</span>)}
                </div>
                <div className="flex justify-between gap-2">
                  <button className={BTN} onClick={() => { navigator.clipboard?.writeText(codes.join("\n")); toast.success(T.copied); }}>{T.copy}</button>
                  <button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium" onClick={() => { setCodes([]); close(); toast.success(T.enabled); }}>{T.savedThem}</button>
                </div>
              </>
            )}
            {stage === "disable" && (
              <>
                <h2 className="text-lg font-semibold text-foreground">{T.disableTitle}</h2>
                <p className="text-sm text-foreground/70">{T.disableDesc}</p>
                <input className={INPUT} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={T.password} />
                <input className={INPUT} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder={T.codeOrRecovery} />
                <div className="flex justify-end gap-2">
                  <button className={BTN} onClick={close}>{T.cancel}</button>
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-60" disabled={busy || !password || !code} onClick={disable}>{T.turnOff}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
