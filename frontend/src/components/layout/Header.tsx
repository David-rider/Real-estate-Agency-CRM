"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from "@/lib/i18n/I18nContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTheme, ThemeName } from "@/lib/theme/ThemeContext";

/**
 * @fileoverview 主应用的顶部导航栏组件 (Main Application Header Component)
 * @description 包含全局搜索、语言切换、主题切换、通知等系统级入口。
 */
export default function Header() {
    const { t, language, setLanguage } = useI18n();
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    
    // Helpers to localize default seeded names
    const getLocalizedName = (name: string | undefined, t: any) => {
        if (name === 'System Admin') return t.roles.ADMIN;
        if (name === 'Regional Manager') return t.roles.MANAGER;
        if (name === 'Sarah Agent') return t.roles.AGENT;
        return name || t.sidebar.guest;
    };
    
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
    const langDropdownRef = useRef<HTMLDivElement>(null);
    const themeDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
                setIsLangDropdownOpen(false);
            }
            if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
                setIsThemeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const themes: { id: ThemeName; label: string; color: string }[] = [
        { id: "luxury", label: "轻奢 Luxury", color: "#B8977E" },
        { id: "modern", label: "现代 Modern", color: "#4F7DF3" },
        { id: "youth", label: "青春 Youth", color: "#7C5CFC" },
        { id: "chinese", label: "中国风 Chinese", color: "#C43B38" },
        { id: "cyberpunk", label: "赛博 Cyber", color: "#00F0FF" },
    ];

    return (
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex-1 flex items-center gap-4">
                {/* Global Search */}
                <div className="relative w-80">
                    <input
                        type="text"
                        placeholder={t.header.searchPlaceholder}
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all text-foreground placeholder:text-foreground/30"
                    />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {/* Theme Switcher */}
                <div className="relative" ref={themeDropdownRef}>
                    <button
                        onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-hover text-sm font-medium text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary/30"
                    >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: themes.find(t => t.id === theme)?.color }} />
                        <svg className={`w-3 h-3 text-foreground/40 transition-transform duration-200 ${isThemeDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isThemeDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-44 bg-surface rounded-xl shadow-lg border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => { setTheme(t.id); setIsThemeDropdownOpen(false); }}
                                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2.5 ${theme === t.id ? "bg-primary/10 text-primary font-semibold" : "text-foreground/70 hover:bg-surface-hover"}`}
                                >
                                    <span className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-border" style={{ backgroundColor: t.color }} />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Language Switcher Dropdown */}
                <div className="relative" ref={langDropdownRef}>
                    <button
                        onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-hover text-sm font-medium text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary/30"
                    >
                        <svg className="w-3.5 h-3.5 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <span className="uppercase text-xs">{language === 'zh' ? '中文' : language === 'es' ? 'ES' : 'EN'}</span>
                        <svg className={`w-3 h-3 text-foreground/40 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isLangDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-36 bg-surface rounded-xl shadow-lg border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <button
                                onClick={() => { setLanguage("en"); setIsLangDropdownOpen(false); }}
                                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${language === "en" ? "bg-primary/10 text-primary font-semibold" : "text-foreground/70 hover:bg-surface-hover"}`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => { setLanguage("zh"); setIsLangDropdownOpen(false); }}
                                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${language === "zh" ? "bg-primary/10 text-primary font-semibold" : "text-foreground/70 hover:bg-surface-hover"}`}
                            >
                                中文 (Chinese)
                            </button>
                            <button
                                onClick={() => { setLanguage("es"); setIsLangDropdownOpen(false); }}
                                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${language === "es" ? "bg-primary/10 text-primary font-semibold" : "text-foreground/70 hover:bg-surface-hover"}`}
                            >
                                Español
                            </button>
                        </div>
                    )}
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-foreground/50 hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors hidden sm:block">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full"></span>
                </button>

                {/* User Profile & Logout */}
                <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-border">
                    <div className="flex flex-col text-right">
                        <span className="text-sm font-semibold text-foreground leading-tight">{getLocalizedName(user?.name, t)}</span>
                        <span className="text-xs text-primary font-medium">{user?.role ? ((t as any).roles?.[user.role] || user.role) : t.roles.GUEST}</span>
                    </div>
                    <button
                        onClick={logout}
                        className="p-1.5 text-foreground/30 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title={t.header.logout}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
