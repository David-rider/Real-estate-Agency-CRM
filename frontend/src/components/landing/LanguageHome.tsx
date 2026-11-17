"use client";

import LandingPageClient from "./LandingPageClient";
import LanguagePage from "@/components/i18n/LanguagePage";
import type { Language } from "@/lib/i18n/translations";

// The home page in one language (/, /zh-CN, /zh-TW, /es); see LanguagePage for how the addresses work
export default function LanguageHome({ lang }: { lang: Language }) {
  return (
    <LanguagePage lang={lang}>
      <LandingPageClient />
    </LanguagePage>
  );
}
