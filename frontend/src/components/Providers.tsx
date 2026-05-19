"use client";

import React from "react";
import { I18nProvider } from "@/lib/i18n/I18nContext";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <I18nProvider>
            <ToastProvider>{children}</ToastProvider>
        </I18nProvider>
    );
}
