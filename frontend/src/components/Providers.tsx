"use client";

import React from "react";
import { I18nProvider } from "@/lib/i18n/I18nContext";
import { ToastProvider } from "@/components/ui/Toast";
import { SentryListener } from "@/lib/sentry";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <I18nProvider>
            <SentryListener />
            <ToastProvider>{children}</ToastProvider>
        </I18nProvider>
    );
}
