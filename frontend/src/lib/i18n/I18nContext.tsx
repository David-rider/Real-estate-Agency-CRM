"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations } from "./translations";
import { API_URL } from "../api";
import { usePathname } from "next/navigation";

// The browser tab title in each language. The server-rendered English titles stay as they are for search engines;
// these replace them in the browser once the language is known.
const TAB_TITLES: Record<Language, Record<string, string>> = {
    en: {},
    "zh-CN": {
        "Real Estate CRM — Agent & Brokerage Management Platform": "房产经纪 CRM — 经纪人与经纪公司管理平台",
        "Real Estate Brokerage CRM — Manage Clients, Listings & Commissions": "房产经纪 CRM — 管理客户、房源与佣金",
    },
    "zh-TW": {
        "Real Estate CRM — Agent & Brokerage Management Platform": "房產經紀 CRM — 經紀人與經紀公司管理平台",
        "Real Estate Brokerage CRM — Manage Clients, Listings & Commissions": "房產經紀 CRM — 管理客戶、房源與佣金",
    },
    es: {
        "Real Estate CRM — Agent & Brokerage Management Platform": "CRM inmobiliario — Plataforma para agentes y corredurías",
        "Real Estate Brokerage CRM — Manage Clients, Listings & Commissions": "CRM inmobiliario — Clientes, propiedades y comisiones",
    },
};
const ORIGINAL_TITLE = Symbol("originalTitle");

const VALID_LANGUAGES: Language[] = ["en", "zh-CN", "zh-TW", "es"];

// Tells the server which language this person uses, so emails and notifications follow it.
// Fire and forget: the interface language must never depend on the network.
export function saveLanguageToAccount(lang: Language, token?: string | null) {
    const t = token ?? localStorage.getItem("token");
    if (!t) return;
    fetch(`${API_URL}/api/settings/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}`, "X-CSRF-Protection": "1" },
        credentials: "include",
        body: JSON.stringify({ preferredLanguage: lang }),
    }).catch(() => {});
}

interface I18nContextProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: typeof translations.en;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");

    // Load preferred language from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("preferredLanguage");
        const validLanguages = VALID_LANGUAGES;

        if (saved) {
            // Migration for legacy "zh" key
            if (saved === "zh") {
                setLanguage("zh-CN");
                localStorage.setItem("preferredLanguage", "zh-CN");
            } else if (validLanguages.includes(saved as Language)) {
                setLanguage(saved as Language);
            }
        }

        // After sign-in on a new device the saved account language is adopted (see AuthContext)
        const adopt = (e: Event) => {
            const lang = (e as CustomEvent<string>).detail as Language;
            if (VALID_LANGUAGES.includes(lang)) {
                setLanguage(lang);
                localStorage.setItem("preferredLanguage", lang);
            }
        };
        window.addEventListener("crm:language", adopt);
        return () => window.removeEventListener("crm:language", adopt);
    }, []);

    // Keep the tab title and <html lang> in the chosen language (page navigation can reset the title)
    const pathname = usePathname();
    useEffect(() => {
        const doc = document as Document & { [ORIGINAL_TITLE]?: string };
        const apply = () => {
            const english = Object.values(TAB_TITLES).some(m => Object.values(m).includes(document.title))
                ? doc[ORIGINAL_TITLE] ?? document.title
                : document.title;
            doc[ORIGINAL_TITLE] = english;
            document.title = TAB_TITLES[language][english] ?? english;
            document.documentElement.lang = language;
        };
        const timer = setTimeout(apply, 50);
        return () => clearTimeout(timer);
    }, [language, pathname]);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem("preferredLanguage", lang);
        saveLanguageToAccount(lang);
    };

    const t = translations[language] as typeof translations.en;

    return (
        <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used within an I18nProvider");
    }
    return context;
}
