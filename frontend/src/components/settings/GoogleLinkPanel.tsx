"use client";

import React from "react";
import { api } from "@/lib/api";
import { useExtra } from "@/lib/i18n/extra";
import { useToast } from "@/components/ui/Toast";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

/** Settings → Security: link or unlink the Google account used for one-click sign-in. */
export default function GoogleLinkPanel() {
  const U = useExtra().ui;
  const X = useExtra();
  const toast = useToast();
  const [linked, setLinked] = React.useState<boolean | null>(null);

  const load = React.useCallback(() => {
    api("/api/settings/social").then((r) => setLinked(!!r.google)).catch(() => setLinked(null));
  }, []);
  React.useEffect(load, [load]);

  const link = async (idToken: string) => {
    try { await api("/api/settings/social/google", { method: "POST", body: { idToken } }); toast.success(U.googleLinked); load(); }
    catch (err) { toast.error(err instanceof Error ? err.message : X.common.error); }
  };
  const unlink = async () => {
    try { await api("/api/settings/social/google", { method: "DELETE" }); toast.success(U.googleUnlinked); load(); }
    catch (err) { toast.error(err instanceof Error ? err.message : X.common.error); }
  };

  if (linked === null) return null;
  return linked ? (
    <div className="flex items-center gap-2">
      <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-500 text-xs">{U.linked}</span>
      <button onClick={unlink} className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-foreground hover:bg-background">{U.unlink}</button>
    </div>
  ) : (
    <div className="w-60"><GoogleSignInButton text="signin_with" onCredential={link} /></div>
  );
}
