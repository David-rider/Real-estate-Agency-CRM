"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockedLanguage, useI18n } from "@/lib/i18n/I18nContext";
import { extraFor } from "@/lib/i18n/extra";
import type { Language } from "@/lib/i18n/translations";
import { LANGUAGES, browserLanguage, localizedPath } from "@/lib/site";

// A public page that has one address per language (the home page, privacy policy, terms): / or /privacy for English,
// /zh-CN, /zh-CN/privacy and so on. Each is generated in its language, so search engines index every version
// and a shared link opens in the right language. `page` is the path after the language ("" = home, "/privacy").
export default function LanguagePage({ lang, page = "", children }: { lang: Language; page?: string; children: React.ReactNode }) {
  const router = useRouter();
  const { setLanguage } = useI18n();
  const [suggest, setSuggest] = useState<Language | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("preferredLanguage"); } catch {}
    if (saved === "zh") saved = "zh-CN";
    if (lang !== "en") {
      // Opening a language's page makes it this visitor's language (menus, emails, the app after sign-in)
      if (saved !== lang) setLanguage(lang);
      return;
    }
    // On the English address: someone who chose another language before goes to that language's page;
    // a first-time visitor whose browser asks for another language is offered it (never forced)
    if (saved && saved !== "en" && (LANGUAGES as string[]).includes(saved)) {
      router.replace(localizedPath(saved as Language, page));
    } else if (!saved) {
      setSuggest(browserLanguage(typeof navigator !== "undefined" ? navigator.language : undefined));
    }
  }, [lang, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const offer = useMemo(() => (suggest ? extraFor(suggest).ui.viewInLanguage : null), [suggest]);

  return (
    <LockedLanguage lang={lang} page={page}>
      {suggest && offer && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-surface ring-1 ring-border shadow-lg text-sm flex items-center gap-3">
          <Link href={localizedPath(suggest, page)} lang={suggest} onClick={() => setLanguage(suggest)} className="font-medium text-primary underline">
            {offer}
          </Link>
          <button onClick={() => setSuggest(null)} aria-label="×" className="text-foreground/50 hover:text-foreground">×</button>
        </div>
      )}
      {children}
    </LockedLanguage>
  );
}
