import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: AuthRequest, res) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

        // 1. Active Listings Count
        const activeListings = await prisma.property.count({
            where: { status: 'ACTIVE', orgId }
        });

        // 2. New Leads Count
        const newLeads = await prisma.client.count({
            where: { status: 'LEAD', orgId }
        });

        // 3. Pending Offers
        const pendingOffers = await prisma.transaction.count({
            where: { status: 'OFFER_REVIEW', orgId }
        });

        // 4. Monthly Deals Pipeline Data
        const allTransactions = await prisma.transaction.findMany({
            where: { orgId },
            select: { createdAt: true }
        });

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonthIndex = new Date().getMonth();

        // Pipeline Conversion Funnel Data
        const allClients = await prisma.client.count({ where: { orgId } });
        const funnelData = [
            { name: 'Total Leads', value: allClients },
            { name: 'Active', value: activeListings },
            { name: 'In Contract', value: pendingOffers },
            { name: 'Closed', value: await prisma.transaction.count({ where: { status: 'CLOSED', orgId } }) }
        ];

        // 6-Month Timeline Data (Deals & Commissions)
        const currentYear = new Date().getFullYear();
        const allCommissions = await prisma.commission.findMany({
            where: { orgId, status: 'PAID', paidAt: { gte: new Date(`${currentYear}-01-01`) } }
        });

        const chartData = [];
        for (let i = 5; i >= 0; i--) {
            let targetMonthIndex = currentMonthIndex - i;
            if (targetMonthIndex < 0) {
                targetMonthIndex += 12;
            }

            const dealsCount = allTransactions.filter(t => new Date(t.createdAt).getMonth() === targetMonthIndex).length;
            const commissionSum = allCommissions
                .filter(c => c.paidAt && new Date(c.paidAt).getMonth() === targetMonthIndex)
                .reduce((sum, c) => sum + (c.netPayout || 0), 0);

            chartData.push({
                name: months[targetMonthIndex],
                deals: dealsCount,
                commission: commissionSum
            });
        }

        const ytdCommission = allCommissions.reduce((sum, c) => sum + (c.netPayout || 0), 0);

        // 5. Action Items (Priority Tasks)
        const pendingOffersList = await prisma.offer.findMany({
            where: { status: 'PENDING', orgId },
            include: { client: true, property: true },
            take: 3,
            orderBy: { createdAt: 'desc' }
        });

        const actionItems = pendingOffersList.map(offer => ({
            id: offer.id,
            type: 'OFFER',
            title: `Review Offer: $${offer.amount.toLocaleString()}`,
            subtitle: `${offer.property.address} (Client: ${offer.client.firstName} ${offer.client.lastName})`,
            actionLabel: 'Review & Respond'
        }));

        // Add gift orders as action items if space
        if (actionItems.length < 3) {
            const pendingGifts = await prisma.giftOrder.findMany({
                where: { status: 'ORDERED', orgId },
                include: { client: true },
                take: 3 - actionItems.length,
                orderBy: { createdAt: 'desc' }
            });
            pendingGifts.forEach(gift => {
                actionItems.push({
                    id: gift.id,
                    type: 'GIFT',
                    title: `Send Gift: ${gift.item}`,
                    subtitle: `Recipient: ${gift.client.firstName} ${gift.client.lastName}`,
                    actionLabel: 'Order Gift'
                });
            });
        }

        const dashboardData = {
            activeListings,
            newLeads,
            pendingOffers,
            chartData,
            funnelData,
            ytdCommission,
            actionItems
        };

        res.json(dashboardData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

export default router;
