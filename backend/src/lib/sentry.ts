/**
 * Lightweight Sentry error reporter using the official Sentry Store/Envelope HTTP API.
 *
 * - Zero external npm dependencies (uses Node 22 built-in `fetch` and `crypto`).
 * - Completely silent / no-op when `SENTRY_DSN` is not configured.
 * - Never blocks or crashes the API server if Sentry is unreachable.
 */
import crypto from 'crypto';

interface ParsedDsn {
    storeUrl: string;
    authHeader: string;
}

function parseDsn(dsn?: string): ParsedDsn | null {
    if (!dsn || !dsn.trim()) return null;
    try {
        const url = new URL(dsn.trim());
        const publicKey = url.username;
        const projectId = url.pathname.replace(/^\/+/, '');
        if (!publicKey || !projectId) return null;
        const storeUrl = `${url.protocol}//${url.host}/api/${projectId}/store/`;
        const authHeader = `Sentry sentry_version=7, sentry_client=recrm-backend/1.0, sentry_key=${publicKey}`;
        return { storeUrl, authHeader };
    } catch {
        return null;
    }
}

export function isSentryEnabled(): boolean {
    return parseDsn(process.env.SENTRY_DSN) !== null;
}

export async function captureBackendException(
    err: unknown,
    context?: {
        path?: string;
        method?: string;
        userId?: string;
        orgId?: string;
        release?: string;
        extra?: Record<string, unknown>;
    }
): Promise<void> {
    const parsed = parseDsn(process.env.SENTRY_DSN);
    if (!parsed) return;

    try {
        const errorObj = err instanceof Error ? err : new Error(typeof err === 'string' ? err : JSON.stringify(err));
        const eventId = crypto.randomBytes(16).toString('hex');
        const payload = {
            event_id: eventId,
            timestamp: new Date().toISOString(),
            platform: 'node',
            level: 'error',
            environment: process.env.NODE_ENV || 'development',
            release: context?.release,
            server_name: 'recrm-api',
            exception: {
                values: [
                    {
                        type: errorObj.name || 'Error',
                        value: errorObj.message || 'Unhandled error',
                        stacktrace: errorObj.stack ? { frames: [{ filename: context?.path || 'server', function: errorObj.stack.slice(0, 1000) }] } : undefined,
                    },
                ],
            },
            request: context?.path
                ? {
                      url: context.path,
                      method: context.method || 'GET',
                  }
                : undefined,
            user: context?.userId
                ? {
                      id: context.userId,
                      orgId: context.orgId,
                  }
                : undefined,
            extra: context?.extra,
        };

        await fetch(parsed.storeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Sentry-Auth': parsed.authHeader,
            },
            body: JSON.stringify(payload),
        });
    } catch {
        // Never allow monitoring failures to impact application availability
    }
}
