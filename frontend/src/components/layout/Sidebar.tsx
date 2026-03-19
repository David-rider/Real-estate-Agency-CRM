"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nContext";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * @fileoverview 主应用的左侧导航栏组件 (Main Application Sidebar Component)
 * @description 根据用户的 RBAC 权限动态展示菜单。包含工作台、客户管理、房源中心等业务模块入口。
 */
export default function Sidebar() {
    const { t } = useI18n();
    const { user } = useAuth();

    const menuItems = [
        { name: t.sidebar.dashboard, path: "/dashboard", icon: "📊" },
        { name: t.sidebar.crm, path: "/crm", icon: "👥" },
        { name: t.sidebar.listings, path: "/listings", icon: "🏠" },
        { name: t.sidebar.marketing, path: "/marketing", icon: "📢" },
        { name: t.sidebar.transactions, path: "/transactions", icon: "🤝" },
        { name: t.sidebar.finance, path: "/finance", icon: "💰" },
        { name: t.sidebar.services, path: "/services", icon: "🎁" },
        { name: t.sidebar.appointments, path: "/appointments", icon: "📅" },
        { name: t.sidebar.documents, path: "/documents", icon: "📁" },
        { name: t.sidebar.settings, path: "/settings", icon: "⚙️" },
    ];

    return (
        <aside className="w-64 bg-background border-r border-border/40 h-screen text-foreground flex flex-col pt-6 flex-shrink-0">
            <div className="px-6 mb-8 text-foreground font-sans font-bold text-2xl tracking-wide flex items-center gap-2">
                <span className="text-primary tracking-tighter">Real Estate Brokerage Management Platform</span> {t.sidebar.adminTitle}
            </div>
            <nav className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface hover:text-primary transition-all font-medium text-sm text-foreground/80"
                    >
                        <span className="text-lg opacity-80">{item.icon}</span>
                        {item.name}
                    </Link>
                ))}
            </nav>
            <div className="p-6 border-t border-border/40 flex flex-col gap-4 bg-surface/30">
                <Link href="/upgrade" className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-hover hover:opacity-90 text-background rounded-xl text-xs uppercase tracking-widest font-bold text-center transition-all shadow-md flex flex-col">
                    <span>{t.sidebar.upgrade}</span>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-sm ring-1 ring-primary/30">
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div className="text-sm">
                        <p className="text-foreground font-semibold">{user?.name || t.sidebar.guest}</p>
                        <p className="text-xs text-foreground/50 font-medium">
                            {user?.tier ? `${(t as any).tiers?.[user.tier] || user.tier} ${t.sidebar.tierSuffix}` : ''}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
