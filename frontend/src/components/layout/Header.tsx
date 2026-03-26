"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from "@/lib/i18n/I18nContext";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * @fileoverview 主应用的顶部导航栏组件 (Main Application Header Component)
 * @description 包含全局搜索、全局通知等系统级入口。
 */
export default function Header() {
    const { t, language, setLanguage } = useI18n();
    const { user, logout } = useAuth();
    
    // Helpers to localize default seeded names
    const getLocalizedName = (name: string | undefined, t: any) => {
        if (name === 'System Admin') return t.roles.ADMIN;
        if (name === 'Regional Manager') return t.roles.MANAGER;
        if (name === 'Sarah Agent') return t.roles.AGENT;
        return name || t.sidebar.guest;
    };
    
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const langDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
                setIsLangDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex-1 flex items-center gap-4">
                {/* Global Search */}
                <div className="relative w-96">
                    <input
                        type="text"
                        placeholder={t.header.searchPlaceholder}
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {/* Language Switcher Dropdown */}
                <div className="relative" ref={langDropdownRef}>
                    <button
                        onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <span>🌐</span>
                        <span className="uppercase">{language === 'zh' ? '中文' : language === 'es' ? 'ES' : 'EN'}</span>
                        <span className={`text-xs text-slate-400 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    {isLangDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                            <button
                                onClick={() => { setLanguage("en"); setIsLangDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${language === "en" ? "bg-blue-50 text-blue-700 font-semibold relative after:absolute after:left-0 after:top-0 after:h-full after:w-1 after:bg-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => { setLanguage("zh"); setIsLangDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${language === "zh" ? "bg-blue-50 text-blue-700 font-semibold relative after:absolute after:left-0 after:top-0 after:h-full after:w-1 after:bg-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
                            >
                                中文 (Chinese)
                            </button>
                            <button
                                onClick={() => { setLanguage("es"); setIsLangDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${language === "es" ? "bg-blue-50 text-blue-700 font-semibold relative after:absolute after:left-0 after:top-0 after:h-full after:w-1 after:bg-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
                            >
                                Español
                            </button>
                        </div>
                    )}
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors hidden sm:block">
                    🔔
                    <span className="absolute top-1.5 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Profile & Logout */}
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="flex flex-col text-right">
                        <span className="text-sm font-bold text-slate-800">{getLocalizedName(user?.name, t)}</span>
                        <span className="text-xs text-blue-600 font-medium">[{user?.role ? ((t as any).roles?.[user.role] || user.role) : t.roles.GUEST}]</span>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title={t.header.logout}
                    >
                        🚪
                    </button>
                </div>
            </div>
        </header>
    );
}
