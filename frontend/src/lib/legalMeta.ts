import type { Metadata } from "next";
import type { Language } from "./i18n/translations";
import { LEGAL } from "./i18n/legal";
import { pageMetadata } from "./site";

// Title, description, canonical and hreflang for the privacy policy or terms in one language.
// Kept out of site.ts so the long legal text never ends up in pages that only need the site address.
export function legalMetadata(doc: "privacy" | "terms", lang: Language): Metadata {
  const d = (LEGAL[lang] ?? LEGAL.en)[doc];
  const description = d.intro.length > 160 ? `${d.intro.slice(0, 157).trimEnd()}…` : d.intro;
  return pageMetadata(lang, `/${doc}`, d.title, description);
}
