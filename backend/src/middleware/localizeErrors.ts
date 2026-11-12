import { Request, Response, NextFunction } from 'express';
import { translateError, requestLang } from '../lib/errorMessages';

// Translate the `error` field of JSON responses into the caller's language (see lib/errorMessages.ts).
export function localizeErrors(req: Request, res: Response, next: NextFunction) {
    const json = res.json.bind(res);
    res.json = (body?: unknown) => {
        if (body && typeof body === 'object' && !Array.isArray(body) && typeof (body as { error?: unknown }).error === 'string') {
            const lang = requestLang(req);
            if (lang !== 'en') body = { ...(body as object), error: translateError((body as { error: string }).error, lang) };
        }
        return json(body);
    };
    next();
}
