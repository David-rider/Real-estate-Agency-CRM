"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useAuth } from '@/lib/auth/AuthContext';

export default function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isLoading } = useAuth();

    const isAuthRoute = pathname === '/login' || pathname === '/signup';

    // Always render children immediately if it's the login/signup page to prevent flashes
    if (isAuthRoute) {
        return (
            <div className="flex-1 w-full bg-background relative z-0">
                {children}
            </div>
        );
    }

    if (isLoading) {
        return <div className="flex-1 flex items-center justify-center bg-background text-foreground/50 tracking-widest uppercase text-xs">Loading application state...</div>;
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 bg-background relative z-0">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
