"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nContext";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * @fileoverview 主应用的左侧导航栏组件 (Main Application Sidebar Component)
 * @description 根据用户的 RBAC 权限动态展示菜单。包含工作台、客户管理、房源中心等业务模块入口。
 */

const SidebarIcon = ({ name }: { name: string }) => {
    const cls = "w-[18px] h-[18px] flex-shrink-0";
    switch (name) {
        case "dashboard":
            return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm-10 9a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zm10-2a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5z" /></svg>;
        case "crm":
            return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
        case "listings":
            return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
        case "marketing":
            return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
        case "transactions":
            return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
        case "finance":
            return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case "services":
            return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
        case "appointments":
            return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
        case "documents":
            return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
        case "settings":
            return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
        default:
            return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="3" strokeWidth={1.8} /></svg>;
    }
};

export default function Sidebar() {
    const { t } = useI18n();
    const { user } = useAuth();
    const pathname = usePathname();
    
    // Helpers to localize default seeded names
    const getLocalizedName = (name: string | undefined, t: any) => {
        if (name === 'System Admin') return t.roles.ADMIN;
        if (name === 'Regional Manager') return t.roles.MANAGER;
        if (name === 'Sarah Agent') return t.roles.AGENT;
        return name || t.sidebar.guest;
    };

    const menuItems = [
        { name: t.sidebar.dashboard, path: "/dashboard", icon: "dashboard" },
        { name: t.sidebar.crm, path: "/crm", icon: "crm" },
        { name: t.sidebar.listings, path: "/listings", icon: "listings" },
        { name: t.sidebar.marketing, path: "/marketing", icon: "marketing" },
        { name: t.sidebar.transactions, path: "/transactions", icon: "transactions" },
        { name: t.sidebar.finance, path: "/finance", icon: "finance" },
        { name: t.sidebar.services, path: "/services", icon: "services" },
        { name: t.sidebar.appointments, path: "/appointments", icon: "appointments" },
        { name: t.sidebar.documents, path: "/documents", icon: "documents" },
        { name: t.sidebar.settings, path: "/settings", icon: "settings" },
    ];

    return (
        <aside className="w-60 bg-background border-r border-border h-screen text-foreground flex flex-col flex-shrink-0">
            {/* Brand */}
            <div className="px-5 h-14 flex items-center border-b border-border flex-shrink-0">
                <span className="text-primary font-bold text-lg tracking-tight">{t.sidebar.brandName}</span>
                <span className="text-foreground/40 text-sm font-medium ml-1.5">{t.sidebar.adminTitle}</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group
                                ${isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-foreground/60 hover:text-foreground hover:bg-surface-hover"
                                }
                            `}
                        >
                            <span className={`${isActive ? "text-primary" : "text-foreground/40 group-hover:text-foreground/60"} transition-colors`}>
                                <SidebarIcon name={item.icon} />
                            </span>
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-border flex flex-col gap-2.5">
                <Link href="/upgrade" className="w-full py-2 bg-primary hover:opacity-90 text-background rounded-lg text-xs uppercase tracking-widest font-bold text-center transition-all shadow-sm">
                    {t.sidebar.upgrade}
                </Link>
                <div className="flex items-center gap-2.5 px-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-sm ring-1 ring-primary/20">
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-foreground text-sm font-semibold truncate">{getLocalizedName(user?.name, t)}</p>
                        <p className="text-xs text-foreground/40 font-medium truncate">
                            {user?.tier ? `${(t as any).tiers?.[user.tier] || user.tier} ${t.sidebar.tierSuffix}` : ''}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
