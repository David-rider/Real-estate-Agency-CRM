"use client";

import React from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nContext";
import type { Language } from "@/lib/i18n/translations";
import { LEGAL } from "@/lib/i18n/legal";

const LANGS: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "zh-CN", label: "中文（简体）" },
  { code: "zh-TW", label: "中文（繁體）" },
  { code: "es", label: "Español" },
];

/** Public privacy policy / terms page, readable signed out, in all four languages. */
export default function LegalPage({ doc }: { doc: "privacy" | "terms" }) {
  const { language, setLanguage } = useI18n();
  const L = LEGAL[language] ?? LEGAL.en;
  const d = L[doc];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-foreground/60 hover:text-foreground">← {L.back}</Link>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent border-b border-border text-foreground/60 outline-none text-xs pb-0.5 cursor-pointer"
          >
            {LANGS.map((l) => <option key={l.code} value={l.code} className="bg-surface">{l.label}</option>)}
          </select>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">{d.title}</h1>
        <p className="text-sm text-foreground/50 mb-6">{d.updated}</p>
        <p className="mb-8 leading-relaxed">{d.intro}</p>
        {d.sections.map((s) => (
          <section key={s.h} className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{s.h}</h2>
            {s.p.map((p, i) => <p key={i} className="mb-3 leading-relaxed text-foreground/80">{p}</p>)}
          </section>
        ))}
        <nav className="border-t border-border pt-6 flex gap-6 text-sm text-foreground/60">
          <Link href="/privacy" className="hover:text-foreground">{L.privacyLink}</Link>
          <Link href="/terms" className="hover:text-foreground">{L.termsLink}</Link>
        </nav>
      </main>
    </div>
  );
}
