// Cloudflare Worker in front of the static site (frontend/out).
// It only runs for the legacy paths listed in wrangler.jsonc (run_worker_first): old links such as
// printed open-house QR codes (/public-listings/:id?openhouse=1) and stored notification links
// (/crm/:id) are redirected to the query-string pages, keeping the original query string.
// Every other request is served straight from the static assets.

export function legacyRedirect(url) {
  const extra = url.search ? '&' + url.search.slice(1) : '';
  let m;
  if ((m = url.pathname.match(/^\/public-listings\/([^/]+)\/sign\/?$/))) return `/property/sign?id=${m[1]}${extra}`;
  if ((m = url.pathname.match(/^\/public-listings\/([^/]+)\/?$/))) return `/property?id=${m[1]}${extra}`;
  if ((m = url.pathname.match(/^\/crm\/([^/]+)\/?$/))) return `/client?id=${m[1]}${extra}`;
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const to = legacyRedirect(url);
    if (to) return Response.redirect(new URL(to, url.origin).toString(), 302);
    return env.ASSETS.fetch(request);
  },
};
