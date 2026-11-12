import { Router } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/authMiddleware';
import { isManager } from '../lib/access';
import { fiscalYearStart } from '../lib/policies';

const router = Router();
const DAY = 24 * 60 * 60 * 1000;

// GET /api/reports/performance — lead-source conversion, time to close and (managers) an agent comparison
router.get('/performance', async (req: AuthRequest, res) => {
    const user = req.user!;
    const manager = isManager(user);
    const start = fiscalYearStart(new Date(), user.policies.finance.fiscalYearStartMonth);
    const scope = manager ? { orgId: user.orgId } : { orgId: user.orgId, agentId: user.userId };

    const [clients, closedDeals, commissions] = await Promise.all([
        prisma.client.findMany({ where: { ...scope, createdAt: { gte: start } }, select: { source: true, status: true, agentId: true } }),
        prisma.transaction.findMany({
            where: { ...scope, status: 'CLOSED', closingDate: { gte: start } },
            select: { agentId: true, price: true, acceptedPrice: true, contractDate: true, closingDate: true, createdAt: true },
        }),
        prisma.commission.findMany({ where: { ...scope, createdAt: { gte: start } }, select: { agentId: true, grossAmount: true } }),
    ]);

    // Lead sources: how many leads came from each source this year and how many of them closed
    const bySource = new Map<string, { source: string; leads: number; closed: number }>();
    for (const c of clients) {
        const key = c.source?.trim() || 'Unknown';
        const row = bySource.get(key) ?? { source: key, leads: 0, closed: 0 };
        row.leads++;
        if (c.status === 'CLOSED') row.closed++;
        bySource.set(key, row);
    }
    const sources = [...bySource.values()]
        .map(r => ({ ...r, conversion: r.leads ? Math.round((r.closed / r.leads) * 1000) / 10 : 0 }))
        .sort((a, b) => b.leads - a.leads);

    // Average days from contract (or deal creation) to closing
    const durations = closedDeals
        .filter(d => d.closingDate)
        .map(d => (d.closingDate!.getTime() - (d.contractDate ?? d.createdAt).getTime()) / DAY)
        .filter(n => n >= 0);
    const avgDaysToClose = durations.length ? Math.round(durations.reduce((s, n) => s + n, 0) / durations.length) : null;
    const closedVolume = closedDeals.reduce((s, d) => s + (d.acceptedPrice ?? d.price), 0);

    let agents: { agentId: string; name: string; newClients: number; closedDeals: number; closedVolume: number; grossCommission: number }[] | undefined;
    if (manager) {
        const team = await prisma.user.findMany({ where: { orgId: user.orgId, isActive: true }, select: { id: true, name: true } });
        agents = team.map(m => ({
            agentId: m.id,
            name: m.name,
            newClients: clients.filter(c => c.agentId === m.id).length,
            closedDeals: closedDeals.filter(d => d.agentId === m.id).length,
            closedVolume: closedDeals.filter(d => d.agentId === m.id).reduce((s, d) => s + (d.acceptedPrice ?? d.price), 0),
            grossCommission: Math.round(commissions.filter(c => c.agentId === m.id).reduce((s, c) => s + c.grossAmount, 0) * 100) / 100,
        })).sort((a, b) => b.closedVolume - a.closedVolume || b.closedDeals - a.closedDeals);
    }

    res.json({
        periodStart: start.toISOString(),
        scope: manager ? 'team' : 'me',
        totals: { leads: clients.length, closedDeals: closedDeals.length, closedVolume, avgDaysToClose },
        sources,
        agents,
    });
});

export default router;
