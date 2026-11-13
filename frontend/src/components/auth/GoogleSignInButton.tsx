"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { GOOGLE_CLIENT_ID } from "@/lib/features";

// Minimal typing for Google Identity Services (https://accounts.google.com/gsi/client)
interface GoogleIdApi {
  initialize: (o: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }) => void;
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
}
declare global {
  interface Window { google?: { accounts?: { id?: GoogleIdApi } } }
}

let scriptPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (typeof window !== "undefined" && window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { scriptPromise = null; reject(new Error("Google script failed to load")); };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

const GSI_LOCALE: Record<string, string> = { en: "en", "zh-CN": "zh_CN", "zh-TW": "zh_TW", es: "es" };

/**
 * Google's official "Sign in with Google" button. Renders nothing unless NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.
 * `onCredential` receives the Google ID token, which the backend verifies.
 */
export default function GoogleSignInButton({ onCredential, text = "continue_with" }: { onCredential: (idToken: string) => void; text?: "continue_with" | "signin_with" | "signup_with" }) {
  const { language } = useI18n();
  const ref = React.useRef<HTMLDivElement>(null);
  const cb = React.useRef(onCredential);
  React.useEffect(() => { cb.current = onCredential; }, [onCredential]);

  React.useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !ref.current) return;
    let cancelled = false;
    loadGsi().then(() => {
      const id = window.google?.accounts?.id;
      if (cancelled || !id || !ref.current) return;
      id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => cb.current(r.credential) });
      ref.current.innerHTML = "";
      id.renderButton(ref.current, { theme: "outline", size: "large", shape: "rectangular", text, width: Math.min(400, ref.current.offsetWidth || 320), locale: GSI_LOCALE[language] ?? "en" });
    }).catch(() => { /* the page still works with email sign-in */ });
    return () => { cancelled = true; };
  }, [language, text]);

  if (!GOOGLE_CLIENT_ID) return null;
  return <div ref={ref} className="w-full flex justify-center min-h-[44px]" />;
}
