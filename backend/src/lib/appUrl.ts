/** Public frontend origin for links in emails and redirects, without a trailing slash. */
export function appUrl(): string {
    return (process.env.APP_URL || 'http://localhost:3000').trim().replace(/\/+$/, '');
}
