import { Router } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/authMiddleware';
import { isManager } from '../lib/access';
import { fiscalYearStart } from '../lib/policies';
import { STALE_DAYS } from './clients';

const router = Router();
const DAY = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// GET /api/dashboard — managers see the brokerage, agents see their own book
router.get('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    const orgId = user.orgId;
    const mine = !isManager(user) || req.query.scope === 'me';
    const agentFilter = mine ? { agentId: user.userId } : {};
    const base = { orgId, ...agentFilter };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + DAY);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    // Fiscal year start comes from Settings > Finance (January by default)
    const startOfYear = fiscalYearStart(now, user.policies.finance.fiscalYearStartMonth);
    const staleCutoff = new Date(now.getTime() - STALE_DAYS * DAY);

    const [
        activeListings, newLeads, pendingOffers, totalClients, inContract, closedDeals,
        recentTransactions, paidCommissions, pendingOffersList, pendingGifts,
        overdueTasks, todaysAppointments, staleLeads, hotLeads,
    ] = await Promise.all([
        prisma.property.count({ where: { ...base, status: 'ACTIVE' } }),
        prisma.client.count({ where: { ...base, OR: [{ status: 'LEAD' }, { funnelStage: 'LEAD' }], NOT: { status: 'ARCHIVED' } } }),
        prisma.offer.count({ where: { ...base, status: { in: ['PENDING', 'COUNTER'] } } }),
        prisma.client.count({ where: { ...base, NOT: { status: 'ARCHIVED' } } }),
        prisma.transaction.count({ where: { ...base, status: { in: ['IN_CONTRACT', 'BOARD_PACKAGE', 'CLEARED_TO_CLOSE'] } } }),
        prisma.transaction.count({ where: { ...base, status: 'CLOSED' } }),
        prisma.transaction.findMany({ where: { ...base, createdAt: { gte: sixMonthsAgo } }, select: { createdAt: true } }),
        prisma.commission.findMany({ where: { ...base, status: 'PAID', paidAt: { gte: sixMonthsAgo < startOfYear ? sixMonthsAgo : startOfYear } } }),
        prisma.offer.findMany({
            where: { ...base, status: 'PENDING' },
            include: { client: true, property: true }, take: 3, orderBy: { createdAt: 'desc' },
        }),
        prisma.giftOrder.findMany({
            where: { ...base, status: 'ORDERED' },
            include: { client: true }, take: 3, orderBy: { createdAt: 'desc' },
        }),
        prisma.task.findMany({
            where: { orgId, agentId: user.userId, status: { in: ['PENDING', 'IN_PROGRESS'] }, dueDate: { lt: now } },
            orderBy: { dueDate: 'asc' }, take: 5,
        }),
        prisma.appointment.findMany({
            where: { orgId, agentId: user.userId, date: { gte: startOfToday, lt: endOfToday }, status: { notIn: ['CANCELLED'] } },
            include: { client: { select: { firstName: true, lastName: true } }, property: { select: { address: true } } },
            orderBy: { date: 'asc' },
        }),
        prisma.client.findMany({
            where: {
                ...base,
                status: { notIn: ['CLOSED', 'ARCHIVED'] },
                OR: [{ lastContactedAt: null }, { lastContactedAt: { lt: staleCutoff } }],
            },
            select: { id: true, firstName: true, lastName: true, lastContactedAt: true, temperature: true, createdAt: true },
            orderBy: [{ lastContactedAt: { sort: 'asc', nulls: 'first' } }],
            take: 5,
        }),
        prisma.client.count({ where: { ...base, temperature: 'HOT', status: { notIn: ['CLOSED', 'ARCHIVED'] } } }),
    ]);

    // Last 6 calendar months, year-aware
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const sameMonth = (x: Date) => x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth();
        chartData.push({
            name: MONTHS[d.getMonth()],
            deals: recentTransactions.filter(t => sameMonth(t.createdAt)).length,
            commission: paidCommissions.filter(c => c.paidAt && sameMonth(c.paidAt)).reduce((s, c) => s + c.netPayout, 0),
        });
    }
    const ytdCommission = paidCommissions
        .filter(c => c.paidAt && c.paidAt >= startOfYear)
        .reduce((s, c) => s + c.netPayout, 0);
    // Annual goal behind the progress bar: your own, or the team's goals added up in the brokerage view
    const goals = await prisma.user.findMany({
        where: mine ? { id: user.userId } : { orgId, isActive: true, annualCommissionGoal: { not: null } },
        select: { annualCommissionGoal: true },
    });
    const goalTotal = goals.reduce((s, g) => s + (g.annualCommissionGoal ?? 0), 0);
    const annualGoal = goalTotal > 0 ? goalTotal : null;

    const funnelData = [
        { name: 'Total Leads', value: totalClients },
        { name: 'Active', value: activeListings },
        { name: 'In Contract', value: inContract },
        { name: 'Closed', value: closedDeals },
    ];

    const actionItems: any[] = [
        ...overdueTasks.slice(0, 2).map(t => ({
            id: t.id, type: 'TASK', title: `Overdue: ${t.title}`,
            subtitle: t.dueDate ? `Was due ${t.dueDate.toISOString().slice(0, 10)}` : '',
            actionLabel: 'Open Tasks', link: '/tasks',
            params: { title: t.title, due: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null },
        })),
        ...pendingOffersList.map(o => ({
            id: o.id, type: 'OFFER', title: `Review Offer: $${o.amount.toLocaleString()}`,
            subtitle: `${o.property.address} (Client: ${o.client.firstName} ${o.client.lastName})`,
            actionLabel: 'Review & Respond', link: '/transactions',
            params: { amount: o.amount, address: o.property.address, client: `${o.client.firstName} ${o.client.lastName}` },
        })),
        ...staleLeads.slice(0, 2).map(c => ({
            id: c.id, type: 'FOLLOW_UP', title: `Follow up: ${c.firstName} ${c.lastName}`,
            subtitle: c.lastContactedAt
                ? `No contact for ${Math.floor((now.getTime() - c.lastContactedAt.getTime()) / DAY)} days`
                : 'Never contacted',
            actionLabel: 'Open Client', link: `/crm/${c.id}`,
            params: { name: `${c.firstName} ${c.lastName}`, days: c.lastContactedAt ? Math.floor((now.getTime() - c.lastContactedAt.getTime()) / DAY) : null },
        })),
        ...pendingGifts.map(g => ({
            id: g.id, type: 'GIFT', title: `Send Gift: ${g.item}`,
            subtitle: `Recipient: ${g.client.firstName} ${g.client.lastName}`,
            actionLabel: 'Order Gift', link: '/services',
            params: { item: g.item, name: `${g.client.firstName} ${g.client.lastName}` },
        })),
    ].slice(0, 6);

    res.json({
        scope: mine ? 'me' : 'org',
        activeListings, newLeads, pendingOffers, hotLeads, inContract,
        chartData, funnelData, ytdCommission, annualGoal, goalScope: mine ? 'me' : 'team', actionItems,
        overdueTasks, todaysAppointments, staleLeads,
    });
});

export default router;
