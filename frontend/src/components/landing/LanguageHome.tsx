"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LandingPageClient from "./LandingPageClient";
import { LockedLanguage, useI18n } from "@/lib/i18n/I18nContext";
import { extraFor } from "@/lib/i18n/extra";
import type { Language } from "@/lib/i18n/translations";
import { HOME_PATH, LANGUAGES, browserLanguage } from "@/lib/site";

// The home page in one language. Each language has its own address (/, /zh-CN, /zh-TW, /es) and is generated
// in that language, so search engines index every version and a shared link opens in the right language.
export default function LanguageHome({ lang }: { lang: Language }) {
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
    // On the English home page: someone who chose another language before goes to that page;
    // a first-time visitor whose browser asks for another language is offered it (never forced)
    if (saved && saved !== "en" && (LANGUAGES as string[]).includes(saved)) {
      router.replace(HOME_PATH[saved as Language]);
    } else if (!saved) {
      setSuggest(browserLanguage(typeof navigator !== "undefined" ? navigator.language : undefined));
    }
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const offer = useMemo(() => (suggest ? extraFor(suggest).ui.viewInLanguage : null), [suggest]);

  return (
    <LockedLanguage lang={lang}>
      {suggest && offer && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-surface ring-1 ring-border shadow-lg text-sm flex items-center gap-3">
          <Link href={HOME_PATH[suggest]} lang={suggest} onClick={() => setLanguage(suggest)} className="font-medium text-primary underline">
            {offer}
          </Link>
          <button onClick={() => setSuggest(null)} aria-label="×" className="text-foreground/50 hover:text-foreground">×</button>
        </div>
      )}
      <LandingPageClient />
    </LockedLanguage>
  );
}
