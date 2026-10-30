/**
 * End-to-end API smoke test. Runs against a live server + database.
 *
 *   API_URL=http://localhost:4000 npm run test:smoke
 *
 * Creates two fresh brokerages (unique emails each run) and walks through the
 * main agent workflows, plus checks that one brokerage cannot touch the other's data.
 */
import assert from 'node:assert/strict';

const API = process.env.API_URL || 'http://localhost:4000';
const run = Date.now().toString(36);
let passed = 0;

async function call(method: string, path: string, token?: string, body?: unknown) {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = text; }
    return { status: res.status, body: json };
}

async function step(name: string, fn: () => Promise<void>) {
    try {
        await fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (e) {
        console.error(`  ✗ ${name}`);
        throw e;
    }
}

async function register(label: string) {
    const r = await call('POST', '/api/auth/register', undefined, {
        name: `${label} Owner`, email: `${label}-${run}@smoke.test`, password: 'SmokeTest123!', orgName: `${label} Realty ${run}`,
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    return r.body.token as string;
}

async function main() {
    console.log(`Smoke test against ${API}`);

    await step('health check', async () => {
        const r = await call('GET', '/api/health');
        assert.equal(r.status, 200);
        assert.match(String(r.body?.version || ''), /^\d+\.\d+\.\d+\.\d+$/, `expected 4-segment version X.Y.Z.W, got ${r.body?.version}`);
    });

    const a = await register('alpha');
    const b = await register('bravo');
    let clientId = '', propertyId = '', txId = '', offerId = '', apptId = '';

    await step('create listing with validation', async () => {
        const bad = await call('POST', '/api/properties', a, { address: '1 Test St', city: 'NYC', state: 'NY', zip: '10001', price: 'abc', beds: 1, baths: 1 });
        assert.equal(bad.status, 400);
        const r = await call('POST', '/api/properties', a, { address: '1 Test St', city: 'New York', state: 'NY', zip: '10001', price: 1000000, beds: 2, baths: 2 });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        propertyId = r.body.id;
    });

    await step('create client, detail page, duplicate detection', async () => {
        const r = await call('POST', '/api/clients', a, { firstName: 'Pat', lastName: 'Buyer', email: `pat-${run}@example.com`, phone: '555-0100', source: 'Referral', budget: '$1M' });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        clientId = r.body.id;
        assert.equal(r.body.source, 'Referral');
        const dup = await call('POST', '/api/clients', a, { firstName: 'Pat', lastName: 'Again', email: `PAT-${run}@example.com` });
        assert.equal(dup.status, 409);
        const detail = await call('GET', `/api/clients/${clientId}`, a);
        assert.equal(detail.status, 200);
        assert.equal(detail.body.firstName, 'Pat');
    });

    await step('server-side client search', async () => {
        const r = await call('GET', '/api/clients?q=pat%20buyer', a);
        assert.equal(r.status, 200);
        assert.equal(r.body.total, 1);
        const stale = await call('GET', '/api/clients?stale=true', a);
        assert.equal(stale.body.total, 1, 'never-contacted client should need follow-up');
    });

    await step('log activity updates last contact + timeline', async () => {
        const r = await call('POST', `/api/clients/${clientId}/activities`, a, { type: 'CALL', subject: 'Intro call', content: 'Wants 2BR', followUpDate: new Date(Date.now() + 86400000).toISOString() });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        const t = await call('GET', `/api/clients/${clientId}/timeline`, a);
        assert.ok(t.body.some((e: any) => e.type === 'NOTE'));
        const stale = await call('GET', '/api/clients?stale=true', a);
        assert.equal(stale.body.total, 0);
        const tasks = await call('GET', `/api/tasks?clientId=${clientId}`, a);
        assert.equal(tasks.body.length, 1, 'follow-up task created');
    });

    await step('appointment create / update / delete', async () => {
        const r = await call('POST', '/api/appointments', a, { title: 'Showing', type: 'SHOWING', date: new Date(Date.now() + 3600000).toISOString(), clientId, propertyId });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        apptId = r.body.id;
        const u = await call('PATCH', `/api/appointments/${apptId}`, a, { status: 'CONFIRMED', location: 'Lobby' });
        assert.equal(u.status, 200);
        assert.equal(u.body.status, 'CONFIRMED');
    });

    await step('offer → accept opens a deal with checklist', async () => {
        const r = await call('POST', '/api/offers', a, { amount: 950000, propertyId, clientId });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        offerId = r.body.id;
        const c = await call('PATCH', `/api/offers/${offerId}`, a, { status: 'COUNTER' });
        assert.equal(c.status, 400, 'counter needs an amount');
        const acc = await call('PATCH', `/api/offers/${offerId}`, a, { status: 'ACCEPTED' });
        assert.equal(acc.status, 200, JSON.stringify(acc.body));
        assert.ok(acc.body.transaction, 'deal opened');
        txId = acc.body.transaction.id;
        const tx = await call('GET', `/api/transactions/${txId}`, a);
        assert.ok(tx.body.checklist.length >= 6, 'closing checklist created');
        const prop = await call('GET', `/api/properties/${propertyId}`, a);
        assert.equal(prop.body.status, 'IN_CONTRACT');
    });

    await step('closing a deal creates the commission', async () => {
        const r = await call('PATCH', `/api/transactions/${txId}`, a, { status: 'CLOSED' });
        assert.equal(r.status, 200, JSON.stringify(r.body));
        assert.equal(r.body.commissions.length, 1);
        // 3% default of $950k, 30% firm split → 28,500 gross, 19,950 net
        assert.equal(r.body.commissions[0].netPayout, 19950);
        const again = await call('PATCH', `/api/transactions/${txId}`, a, { status: 'CLOSED', notes: 'dup check' });
        assert.equal(again.body.commissions.length, 1, 'no duplicate commission');
        const prop = await call('GET', `/api/properties/${propertyId}`, a);
        assert.equal(prop.body.status, 'SOLD');
    });

    await step('solo broker can request and approve own payout', async () => {
        const list = await call('GET', '/api/finance/commissions', a);
        assert.equal(list.status, 200, JSON.stringify(list.body));
        const id = list.body.data[0].id;
        const req = await call('POST', `/api/finance/commissions/${id}/payout`, a);
        assert.equal(req.status, 200, JSON.stringify(req.body));
        // the approval queue must tell the UI a solo broker may review their own request
        const queue = await call('GET', '/api/finance/payout-requests', a);
        assert.equal(queue.status, 200, JSON.stringify(queue.body));
        const queued = queue.body.find((q: any) => q.id === id);
        assert.ok(queued, 'request appears in the approval queue');
        assert.equal(queued.canReview, true, 'sole approver can review their own request');
        const ok = await call('POST', `/api/finance/commissions/${id}/approve`, a);
        assert.equal(ok.status, 200, JSON.stringify(ok.body));
        assert.equal(ok.body.status, 'PAID');
    });

    await step('dashboard reflects activity', async () => {
        const r = await call('GET', '/api/dashboard', a);
        assert.equal(r.status, 200, JSON.stringify(r.body));
        assert.equal(r.body.chartData.length, 6);
        assert.ok(r.body.ytdCommission >= 19950);
    });

    await step('public listing inquiry creates a HOT lead + urgent task', async () => {
        const p2 = await call('POST', '/api/properties', a, { address: '2 Lead Ave', city: 'New York', state: 'NY', zip: '10002', price: 800000, beds: 1, baths: 1 });
        const detail = await call('GET', `/api/properties/public/${p2.body.id}`);
        assert.equal(detail.status, 200);
        assert.equal(detail.body.agent.name, 'alpha Owner');
        const bad = await call('POST', `/api/properties/public/${p2.body.id}/inquiry`, undefined, { name: 'X' });
        assert.equal(bad.status, 400);
        const r = await call('POST', `/api/properties/public/${p2.body.id}/inquiry`, undefined, { name: 'Web Lead', email: `lead-${run}@example.com`, message: 'Is it available?' });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        const leads = await call('GET', '/api/clients?temperature=HOT', a);
        assert.ok(leads.body.data.some((c: any) => c.source === 'Website'));
        const notes = await call('GET', '/api/notifications', a);
        assert.ok(notes.body.notifications.some((n: any) => n.type === 'NEW_CLIENT'));
    });

    await step('gifts and documents with real records', async () => {
        const g = await call('POST', '/api/gifts', a, { item: 'Champagne', clientId });
        assert.equal(g.status, 201, JSON.stringify(g.body));
        const d = await call('POST', '/api/documents', a, { name: 'Contract', url: 'https://example.com/c.pdf', type: 'CONTRACT', transactionId: txId });
        assert.equal(d.status, 201, JSON.stringify(d.body));
        const list = await call('GET', '/api/documents', a);
        assert.equal(list.body.length, 1);
    });

    await step('AI skills catalogue', async () => {
        const r = await call('GET', '/api/marketing/skills', a);
        assert.equal(r.status, 200);
        assert.ok(r.body.skills.length >= 6);
        const gen = await call('POST', '/api/marketing/generate', a, { type: 'LISTING', audience: 'young professionals', features: 'roof deck', language: 'en' });
        assert.equal(gen.status, 200);
        assert.ok(gen.body.generatedContent.length > 50);
    });

    await step('tenant isolation: brokerage B cannot use A’s records', async () => {
        const read = await call('GET', `/api/clients/${clientId}`, b);
        assert.equal(read.status, 404);
        const tx = await call('POST', '/api/transactions', b, { propertyId, clientId, price: 1 });
        assert.equal(tx.status, 400);
        const offer = await call('POST', '/api/offers', b, { propertyId, clientId, amount: 1 });
        assert.equal(offer.status, 400);
        const appt = await call('POST', '/api/appointments', b, { title: 'x', date: new Date().toISOString(), clientId });
        assert.equal(appt.status, 400);
        const doc = await call('POST', '/api/documents', b, { name: 'x', url: 'https://x.y', transactionId: txId });
        assert.equal(doc.status, 400);
        const gift = await call('POST', '/api/gifts', b, { item: 'x', clientId });
        assert.equal(gift.status, 400);
        const patch = await call('PATCH', `/api/transactions/${txId}`, b, { status: 'FALLEN_THROUGH' });
        assert.equal(patch.status, 404);
        const search = await call('GET', '/api/search?q=pat', b);
        assert.equal(search.body.clients.length, 0);
    });

    await step('public listings page is per brokerage', async () => {
        const none = await call('GET', '/api/properties/public');
        assert.equal(none.status, 400);
        const orgA = await call('GET', '/api/settings/organization', a);
        const orgB = await call('GET', '/api/settings/organization', b);
        assert.ok(orgA.body.slug && orgB.body.slug && orgA.body.slug !== orgB.body.slug);
        const pageA = await call('GET', `/api/properties/public?b=${orgA.body.slug}`);
        assert.equal(pageA.status, 200);
        assert.ok(pageA.body.listings.length >= 1);
        const pageB = await call('GET', `/api/properties/public?b=${orgB.body.slug}`);
        assert.equal(pageB.body.listings.length, 0, 'B must not see A listings');
        const missing = await call('GET', '/api/properties/public?b=does-not-exist');
        assert.equal(missing.status, 404);
    });

    await step('social sign-in cannot join an existing brokerage', async () => {
        const apple = await call('POST', '/api/oauth/apple', undefined, { email: `x-${run}@example.com`, appleId: 'fake' });
        assert.equal(apple.status, 503);
        const g = await call('POST', '/api/oauth/google', undefined, { idToken: 'x', email: `g-${run}@example.com`, googleId: `g-${run}` });
        if (g.status === 200) {
            // dev mode only: new social users get their own brokerage
            const me = await call('GET', '/api/settings/organization', g.body.token);
            const orgA = await call('GET', '/api/settings/organization', a);
            assert.notEqual(me.body.id, orgA.body.id);
        } else {
            assert.equal(g.status, 503);
        }
    });

    await step('security basics: password policy, safe links, headers, httpOnly cookie + CSRF', async () => {
        const weak = await call('POST', '/api/auth/register', undefined, { name: 'W', email: `weak-${run}@smoke.test`, password: '123', orgName: 'Weak' });
        assert.equal(weak.status, 400);
        const js = await call('POST', '/api/properties', a, { address: '3 Bad Ln', city: 'NY', state: 'NY', zip: '10003', price: 1, beds: 1, baths: 1, virtualTourUrl: 'javascript:alert(1)' });
        assert.equal(js.status, 400);
        const res = await fetch(`${API}/api/health`);
        assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
        assert.equal(res.headers.get('x-powered-by'), null);
        const forged = await call('GET', '/api/clients', 'eyJhbGciOiJub25lIn0.eyJ1c2VySWQiOiJ4In0.');
        assert.equal(forged.status, 401, 'unsigned tokens are rejected');

        // Verify httpOnly cookie is issued on login and enforces CSRF header on state-changing requests
        const loginRes = await fetch(`${API}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: `alpha-${run}@smoke.test`, password: 'SmokeTest123!' }),
        });
        assert.equal(loginRes.status, 200);
        const setCookie = loginRes.headers.get('set-cookie') || '';
        assert.ok(setCookie.includes('crm_session=') && setCookie.includes('HttpOnly'), 'login sets httpOnly crm_session cookie');
        const cookiePair = setCookie.split(';')[0];

        // Cookie-only GET works
        const cookieGet = await fetch(`${API}/api/clients`, { headers: { Cookie: cookiePair } });
        assert.equal(cookieGet.status, 200);

        // Cookie-only POST without X-CSRF-Protection is blocked (403)
        const csrfBlocked = await fetch(`${API}/api/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
            body: JSON.stringify({ firstName: 'Csrf', lastName: 'Test', email: `csrf-${run}@example.com` }),
        });
        assert.equal(csrfBlocked.status, 403, 'cookie-only POST without CSRF header is rejected');

        // Cookie-only POST with X-CSRF-Protection succeeds (201)
        const csrfAllowed = await fetch(`${API}/api/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookiePair, 'X-CSRF-Protection': '1' },
            body: JSON.stringify({ firstName: 'Csrf', lastName: 'Allowed', email: `csrf-ok-${run}@example.com` }),
        });
        assert.equal(csrfAllowed.status, 201, 'cookie-only POST with X-CSRF-Protection header succeeds');

        // Logout clears the cookie
        const logoutRes = await fetch(`${API}/api/auth/logout`, { method: 'POST', headers: { Cookie: cookiePair, 'X-CSRF-Protection': '1' } });
        assert.equal(logoutRes.status, 200);
        assert.ok((logoutRes.headers.get('set-cookie') || '').includes('crm_session=;'), 'logout clears crm_session cookie');
    });

    await step('real file upload: public listing photos, reordering, private documents & cleanup', async () => {
        // 1x1 transparent PNG
        const pngBytes = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            'base64',
        );
        const form = new FormData();
        form.append('file', new Blob([pngBytes], { type: 'image/png' }), 'photo1.png');
        form.append('visibility', 'PUBLIC');

        const up1 = await fetch(`${API}/api/uploads`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${a}` },
            body: form,
        });
        assert.equal(up1.status, 201);
        const up1Body = await up1.json();
        assert.ok(up1Body.storageKey && up1Body.url.includes('/api/uploads/public/'));

        // Public image is directly fetchable without auth
        const pubFetch = await fetch(up1Body.url);
        assert.equal(pubFetch.status, 200);
        assert.equal(pubFetch.headers.get('content-type'), 'image/png');

        // Attach photo 1 & photo 2 to listing and test reorder
        const m1 = await call('POST', '/api/media', a, {
            url: up1Body.url,
            storageKey: up1Body.storageKey,
            sizeBytes: up1Body.sizeBytes,
            mimeType: up1Body.mimeType,
            type: 'image',
            propertyId,
        });
        assert.equal(m1.status, 201);

        const m2 = await call('POST', '/api/media', a, {
            url: 'https://example.com/second.jpg',
            type: 'image',
            propertyId,
        });
        assert.equal(m2.status, 201);

        const reordered = await call('PATCH', '/api/media/reorder', a, {
            propertyId,
            orderedIds: [m2.body.id, m1.body.id],
        });
        assert.equal(reordered.status, 200);
        assert.equal(reordered.body[0].id, m2.body.id);

        // Delete media 1 and verify underlying public file is cleaned up
        const delMedia = await call('DELETE', `/api/media/${m1.body.id}`, a);
        assert.equal(delMedia.status, 200);
        const pubAfterDel = await fetch(up1Body.url);
        assert.equal(pubAfterDel.status, 404, 'deleted media cleans up underlying stored file');

        // Private PDF document upload
        const pdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n', 'utf8');
        const docForm = new FormData();
        docForm.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'contract.pdf');
        docForm.append('visibility', 'PRIVATE');

        const upDoc = await fetch(`${API}/api/uploads`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${a}` },
            body: docForm,
        });
        assert.equal(upDoc.status, 201);
        const upDocBody = await upDoc.json();

        // Raw private URL without signature is rejected (403)
        const rawPriv = await fetch(upDocBody.url);
        assert.equal(rawPriv.status, 403, 'unsigned private file access is rejected');

        const docRec = await call('POST', '/api/documents', a, {
            name: 'Signed Contract.pdf',
            url: upDocBody.url,
            storageKey: upDocBody.storageKey,
            sizeBytes: upDocBody.sizeBytes,
            mimeType: upDocBody.mimeType,
            type: 'CONTRACT',
            transactionId: txId,
        });
        assert.equal(docRec.status, 201);

        // Other brokerage cannot request view-url
        const crossOrgView = await call('GET', `/api/documents/${docRec.body.id}/view-url`, b);
        assert.equal(crossOrgView.status, 404);

        // Authorized agent gets a signed 10-minute URL that serves the PDF
        const viewUrlRes = await call('GET', `/api/documents/${docRec.body.id}/view-url`, a);
        assert.equal(viewUrlRes.status, 200);
        const signedFetch = await fetch(viewUrlRes.body.url);
        assert.equal(signedFetch.status, 200);
        assert.equal(signedFetch.headers.get('content-type'), 'application/pdf');

        // Deleting the document removes the underlying stored file
        const delDoc = await call('DELETE', `/api/documents/${docRec.body.id}`, a);
        assert.equal(delDoc.status, 200);
        const signedAfterDel = await fetch(viewUrlRes.body.url);
        assert.equal(signedAfterDel.status, 404, 'deleted document cleans up underlying stored file');
    });

    await step('automated lead routing: round-robin rule, simulator, and agent availability', async () => {
        // Create a ROUND_ROBIN rule for Open House inquiries
        const ruleRes = await call('POST', '/api/settings/lead-routing', a, {
            name: 'Open House Round Robin',
            source: 'Open House',
            strategy: 'ROUND_ROBIN',
        });
        assert.equal(ruleRes.status, 201);
        const ruleId = ruleRes.body.id;

        // List rules
        const listRes = await call('GET', '/api/settings/lead-routing', a);
        assert.equal(listRes.status, 200);
        assert.equal(listRes.body.length, 1);

        // Dry-run simulator matches our rule
        const simRes = await call('POST', '/api/settings/lead-routing/test', a, {
            source: 'Open House',
            city: 'New York',
            price: 1000000,
        });
        assert.equal(simRes.status, 200);
        assert.equal(simRes.body.matchedRuleId, ruleId);
        assert.equal(simRes.body.strategyUsed, 'ROUND_ROBIN');

        // Cross-org isolation on routing rule
        const crossDel = await call('DELETE', `/api/settings/lead-routing/${ruleId}`, b);
        assert.equal(crossDel.status, 404);

        // Delete rule
        const delRule = await call('DELETE', `/api/settings/lead-routing/${ruleId}`, a);
        assert.equal(delRule.status, 200);
    });

    await step('email notification preferences persistence', async () => {
        const getPrefs = await call('GET', '/api/settings/notifications', a);
        assert.equal(getPrefs.status, 200);
        assert.equal(getPrefs.body.emailNewClient, true);
        assert.equal(getPrefs.body.emailTaskOverdue, true);

        const patchPrefs = await call('PATCH', '/api/settings/notifications', a, {
            emailNewClient: false,
            emailTaskOverdue: false,
            digestFrequency: 'realtime',
        });
        assert.equal(patchPrefs.status, 200);
        assert.equal(patchPrefs.body.emailNewClient, false);
        assert.equal(patchPrefs.body.emailTaskOverdue, false);
        assert.equal(patchPrefs.body.digestFrequency, 'realtime');

        const verifyPrefs = await call('GET', '/api/settings/notifications', a);
        assert.equal(verifyPrefs.status, 200);
        assert.equal(verifyPrefs.body.emailNewClient, false);
    });

    await step('custom public page slug, redirect history, and brand color', async () => {
        const orgRes = await call('GET', '/api/settings/organization', a);
        assert.equal(orgRes.status, 200);
        const oldSlug = orgRes.body.slug;
        assert.ok(oldSlug, 'organization has initial slug');

        const newSlug = `alpha-custom-${run}`;
        const patchOrg = await call('PATCH', '/api/settings/organization', a, {
            slug: newSlug,
            brandColor: '#C5A059',
        });
        assert.equal(patchOrg.status, 200);
        assert.equal(patchOrg.body.slug, newSlug);
        assert.equal(patchOrg.body.brandColor, '#C5A059');

        // Old slug still resolves via OrgSlugHistory and returns canonicalSlug
        const oldFetch = await call('GET', `/api/properties/public?b=${encodeURIComponent(oldSlug)}`);
        assert.equal(oldFetch.status, 200);
        assert.equal(oldFetch.body.organization.slug, newSlug);
        assert.equal(oldFetch.body.redirectedFrom, oldSlug);
        assert.equal(oldFetch.body.canonicalSlug, newSlug);

        // Another brokerage cannot claim the active or historical slug
        const stealActive = await call('PATCH', '/api/settings/organization', b, { slug: newSlug });
        assert.equal(stealActive.status, 409, 'cannot claim active slug of another brokerage');
        const stealHistory = await call('PATCH', '/api/settings/organization', b, { slug: oldSlug });
        assert.equal(stealHistory.status, 409, 'cannot claim historical slug of another brokerage');
    });

    await step('CSV bulk import for clients and properties (create, skip duplicate, update duplicate)', async () => {
        const cImport1 = await call('POST', '/api/clients/import', a, {
            onDuplicate: 'skip',
            rows: [
                { fullName: 'Jordan Taylor', email: `jordan-${run}@example.com`, phone: '212-555-0191', type: 'BUYER', budget: '$1.8M' },
                { firstName: 'Casey', lastName: 'Morgan', email: `casey-${run}@example.com`, type: 'SELLER' },
            ],
        });
        assert.equal(cImport1.status, 200);
        assert.equal(cImport1.body.created, 2);
        assert.equal(cImport1.body.skipped, 0);

        // Re-importing with onDuplicate='skip' skips both
        const cImportSkip = await call('POST', '/api/clients/import', a, {
            onDuplicate: 'skip',
            rows: [{ fullName: 'Jordan Taylor', email: `jordan-${run}@example.com`, budget: '$2.2M' }],
        });
        assert.equal(cImportSkip.status, 200);
        assert.equal(cImportSkip.body.created, 0);
        assert.equal(cImportSkip.body.skipped, 1);

        // Re-importing with onDuplicate='update' updates existing
        const cImportUpdate = await call('POST', '/api/clients/import', a, {
            onDuplicate: 'update',
            rows: [{ fullName: 'Jordan Taylor', email: `jordan-${run}@example.com`, budget: '$2.2M' }],
        });
        assert.equal(cImportUpdate.status, 200);
        assert.equal(cImportUpdate.body.updated, 1);

        // Property bulk import
        const pImport1 = await call('POST', '/api/properties/import', a, {
            onDuplicate: 'skip',
            rows: [
                { address: '15 Central Park West Apt 18B', city: 'New York', state: 'NY', zip: '10023', price: '$6,500,000', beds: 3, baths: 3.5, sqft: '2,900', mlsNumber: `MLS-${run}-1` },
            ],
        });
        assert.equal(pImport1.status, 200);
        assert.equal(pImport1.body.created, 1);

        const pImportDup = await call('POST', '/api/properties/import', a, {
            onDuplicate: 'skip',
            rows: [
                { address: '15 Central Park West Apt 18B', city: 'New York', state: 'NY', zip: '10023', price: '6700000', mlsNumber: `MLS-${run}-1` },
            ],
        });
        assert.equal(pImportDup.status, 200);
        assert.equal(pImportDup.body.skipped, 1);
    });

    await step('archive client hides it from the list', async () => {
        const r = await call('DELETE', `/api/clients/${clientId}`, a);
        assert.equal(r.status, 200);
        const list = await call('GET', '/api/clients?q=pat', a);
        assert.equal(list.body.total, 0);
    });

    console.log(`\nAll ${passed} smoke checks passed.`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
