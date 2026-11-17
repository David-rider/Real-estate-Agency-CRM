import type { Metadata } from "next";
import type { Language } from "./i18n/translations";

// The public address of the site (set NEXT_PUBLIC_SITE_URL per host; the Cloudflare address is the main one)
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://real-estate-agency-crm.apexzone.workers.dev").replace(/\/+$/, "");

export const LANGUAGES: Language[] = ["en", "zh-CN", "zh-TW", "es"];

// The home page has one address per language, so search engines and shared links get the right language
export const HOME_PATH: Record<Language, string> = { en: "/", "zh-CN": "/zh-CN", "zh-TW": "/zh-TW", es: "/es" };

// Address of a public page in a language: "" = home (/, /zh-CN …), "/privacy" → /privacy, /zh-CN/privacy …
export const localizedPath = (lang: Language, page = "") => (lang === "en" ? page || "/" : `${HOME_PATH[lang]}${page}`);
export const localizedUrl = (lang: Language, page = "") => (lang === "en" && !page ? SITE_URL : `${SITE_URL}${localizedPath(lang, page)}`);
export const homeUrl = (lang: Language) => localizedUrl(lang);

// canonical + hreflang (all four languages and x-default) for a page that exists in every language
function languageAlternates(lang: Language, page: string): Metadata["alternates"] {
  const languages: Record<string, string> = Object.fromEntries(LANGUAGES.map((l) => [l, localizedUrl(l, page)]));
  languages["x-default"] = localizedUrl("en", page);
  return { canonical: localizedUrl(lang, page), languages };
}

const OG_LOCALE: Record<Language, string> = { en: "en_US", "zh-CN": "zh_CN", "zh-TW": "zh_TW", es: "es_US" };

// Metadata for a public page in one language (title gets the layout's " | Real Estate CRM" suffix)
export function pageMetadata(lang: Language, page: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: languageAlternates(lang, page),
    openGraph: { title, description, url: localizedUrl(lang, page), siteName: "Real Estate CRM", type: "website", locale: OG_LOCALE[lang] },
  };
}

// The language a browser asks for, mapped to one of ours (null = English or unknown)
export function browserLanguage(nav: string | undefined): Language | null {
  const l = (nav || "").toLowerCase();
  if (/^zh-(tw|hk|mo|hant)/.test(l)) return "zh-TW";
  if (l.startsWith("zh")) return "zh-CN";
  if (l.startsWith("es")) return "es";
  return null;
}

// Title and description of the home page in each language. The titles match TAB_TITLES in I18nContext.
const HOME_META: Record<Language, { title: string; description: string; ogTitle: string; ogDescription: string; locale: string }> = {
  en: {
    title: "Real Estate Brokerage CRM — Manage Clients, Listings & Commissions",
    description: "The all-in-one CRM platform for real estate agents and brokerages. Manage clients, track listings, close deals faster, and automate commission splits.",
    ogTitle: "Real Estate Brokerage CRM — Close More Deals",
    ogDescription: "All-in-one platform for real estate agents: clients, listings, deals & commissions.",
    locale: "en_US",
  },
  "zh-CN": {
    title: "房产经纪 CRM — 管理客户、房源与佣金",
    description: "为房产经纪人和经纪公司打造的一站式 CRM：管理客户、跟进房源、加快成交、自动计算佣金分成，支持中英文等四种语言。",
    ogTitle: "房产经纪 CRM — 成交更多",
    ogDescription: "经纪人的一站式平台：客户、房源、交易与佣金。",
    locale: "zh_CN",
  },
  "zh-TW": {
    title: "房產經紀 CRM — 管理客戶、房源與佣金",
    description: "為房產經紀人和經紀公司打造的一站式 CRM：管理客戶、追蹤房源、加快成交、自動計算佣金分成，支援中英文等四種語言。",
    ogTitle: "房產經紀 CRM — 成交更多",
    ogDescription: "經紀人的一站式平台：客戶、房源、交易與佣金。",
    locale: "zh_TW",
  },
  es: {
    title: "CRM inmobiliario — Clientes, propiedades y comisiones",
    description: "La plataforma CRM todo en uno para agentes y corredurías inmobiliarias. Gestione clientes, siga sus propiedades, cierre operaciones más rápido y calcule las comisiones automáticamente.",
    ogTitle: "CRM inmobiliario — Cierre más operaciones",
    ogDescription: "Plataforma todo en uno para agentes: clientes, propiedades, operaciones y comisiones.",
    locale: "es_US",
  },
};

export function homeMetadata(lang: Language): Metadata {
  const m = HOME_META[lang];
  return {
    title: { absolute: m.title }, // no " | Real Estate CRM" suffix: the title already names the product
    description: m.description,
    alternates: languageAlternates(lang, ""),
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url: homeUrl(lang),
      siteName: "Real Estate CRM",
      type: "website",
      locale: m.locale,
      alternateLocale: LANGUAGES.filter((l) => l !== lang).map((l) => HOME_META[l].locale),
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: m.ogTitle }],
    },
    twitter: { card: "summary_large_image", title: m.ogTitle, description: m.ogDescription, images: [`${SITE_URL}/og-image.png`] },
  };
}
