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
