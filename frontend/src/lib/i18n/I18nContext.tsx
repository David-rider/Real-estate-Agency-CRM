"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations } from "./translations";

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
        const validLanguages: Language[] = ["en", "zh-CN", "zh-TW", "es"];
        
        if (saved) {
            // Migration for legacy "zh" key
            if (saved === "zh") {
                setLanguage("zh-CN");
                localStorage.setItem("preferredLanguage", "zh-CN");
            } else if (validLanguages.includes(saved as Language)) {
                setLanguage(saved as Language);
            }
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem("preferredLanguage", lang);
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
