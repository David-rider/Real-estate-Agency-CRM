"use client";

import { useEffect } from "react";

/**
 * Lightweight client-side Sentry reporter.
 * - Zero npm dependencies.
 * - Completely silent when NEXT_PUBLIC_SENTRY_DSN is not configured.
 * - Captures unhandled window errors and unhandled promise rejections in production.
 */
function parseClientDsn(dsn?: string): string | null {
  if (!dsn || !dsn.trim()) return null;
  try {
    const url = new URL(dsn.trim());
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\/+/, "");
    if (!publicKey || !projectId) return null;
    return `${url.protocol}//${url.host}/api/${projectId}/store/?sentry_version=7&sentry_key=${publicKey}&sentry_client=recrm-frontend/1.0`;
  } catch {
    return null;
  }
}

export async function captureFrontendException(err: unknown, extra?: Record<string, unknown>) {
  const endpoint = parseClientDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);
  if (!endpoint || typeof window === "undefined") return;

  try {
    const errorObj = err instanceof Error ? err : new Error(typeof err === "string" ? err : "Client error");
    const payload = {
      timestamp: new Date().toISOString(),
      platform: "javascript",
      level: "error",
      environment: process.env.NODE_ENV || "production",
      request: {
        url: window.location.href,
        headers: { "User-Agent": navigator.userAgent },
      },
      exception: {
        values: [
          {
            type: errorObj.name || "Error",
            value: errorObj.message || "Unhandled client error",
            stacktrace: errorObj.stack
              ? { frames: [{ filename: window.location.pathname, function: errorObj.stack.slice(0, 1000) }] }
              : undefined,
          },
        ],
      },
      extra,
    };

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Never interrupt user experience if Sentry reporting fails
  }
}

export function SentryListener() {
  useEffect(() => {
    if (!parseClientDsn(process.env.NEXT_PUBLIC_SENTRY_DSN)) return;

    const onError = (event: ErrorEvent) => {
      void captureFrontendException(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      void captureFrontendException(event.reason, { type: "unhandledrejection" });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
