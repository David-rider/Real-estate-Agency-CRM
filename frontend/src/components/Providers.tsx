"use client";

import React from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { SentryListener } from "@/lib/sentry";

// The language provider lives once, in app/layout.tsx. A second one here kept its own language and,
// on page changes, set the tab title and <html lang> back to a stale language.
export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SentryListener />
            <ToastProvider>{children}</ToastProvider>
        </>
    );
}
