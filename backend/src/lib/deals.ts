import { Transaction } from '@prisma/client';
import { prisma } from '../server';
import { createNotification } from '../routes/notifications';

const DAY = 24 * 60 * 60 * 1000;

export type ChecklistAnchor = 'CONTRACT' | 'CLOSING';
export type ChecklistPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export interface ChecklistItem { title: string; anchor: ChecklistAnchor; offsetDays: number; priority: ChecklistPriority }

/** The standard checklist, shown as the starting point when a brokerage writes its own. */
export const STANDARD_CHECKLIST: ChecklistItem[] = [
    { title: 'Collect fully signed contract and earnest-money deposit', anchor: 'CONTRACT', offsetDays: 2, priority: 'URGENT' },
    { title: 'Send contract to attorney / title company', anchor: 'CONTRACT', offsetDays: 2, priority: 'HIGH' },
    { title: 'Schedule home inspection', anchor: 'CONTRACT', offsetDays: 5, priority: 'HIGH' },
    { title: 'Confirm mortgage application and commitment letter', anchor: 'CONTRACT', offsetDays: 21, priority: 'HIGH' },
    { title: 'Prepare and submit board / HOA package (if co-op or condo)', anchor: 'CONTRACT', offsetDays: 14, priority: 'MEDIUM' },
    { title: 'Order title search and resolve any exceptions', anchor: 'CONTRACT', offsetDays: 10, priority: 'MEDIUM' },
    { title: 'Confirm closing date, location and funds with all parties', anchor: 'CLOSING', offsetDays: -3, priority: 'HIGH' },
    { title: 'Schedule final walk-through', anchor: 'CLOSING', offsetDays: -1, priority: 'MEDIUM' },
    { title: 'Send closing gift and ask for a review / referral', anchor: 'CLOSING', offsetDays: 3, priority: 'LOW' },
];

const PRIORITIES: ChecklistPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// Validates a brokerage's checklist; returns the cleaned items, or an error message.
export function parseChecklistTemplate(raw: unknown): { items: ChecklistItem[] } | { error: string } {
    if (!Array.isArray(raw)) return { error: 'The checklist must be a list of items' };
    if (raw.length === 0 || raw.length > 40) return { error: 'The checklist needs between 1 and 40 items' };
    const items: ChecklistItem[] = [];
    for (const r of raw as any[]) {
        const title = typeof r?.title === 'string' ? r.title.trim().slice(0, 200) : '';
        if (!title) return { error: 'Every item needs a title' };
        const anchor = r?.anchor === 'CLOSING' ? 'CLOSING' : r?.anchor === 'CONTRACT' ? 'CONTRACT' : null;
        if (!anchor) return { error: 'Each item is due relative to the contract date or the closing date' };
        const offsetDays = Number(r?.offsetDays);
        if (!Number.isInteger(offsetDays) || offsetDays < -365 || offsetDays > 365) return { error: 'Days must be a whole number between -365 and 365' };
        const priority = PRIORITIES.includes(r?.priority) ? r.priority : 'MEDIUM';
        items.push({ title, anchor, offsetDays, priority });
    }
    return { items };
}

/**
 * Contract-to-close checklist created as tasks when a deal is opened. A brokerage's own
 * template is used when it has one; otherwise the standard list, adjusted for contingencies.
 * Due dates are relative to the contract date (or today) and the closing date.
 */
export async function createClosingChecklist(tx: Transaction) {
    const start = (tx.contractDate ?? new Date()).getTime();
    const closing = tx.closingDate?.getTime();
    const org = await prisma.organization.findUnique({ where: { id: tx.orgId }, select: { checklistTemplate: true } });
    const custom = org?.checklistTemplate ? parseChecklistTemplate(org.checklistTemplate) : null;

    let items: { title: string; due: number | null; priority: ChecklistPriority }[];
    if (custom && 'items' in custom) {
        items = custom.items.map(i => ({
            title: i.title,
            priority: i.priority,
            due: i.anchor === 'CONTRACT' ? start + i.offsetDays * DAY : closing ? closing + i.offsetDays * DAY : null,
        }));
    } else {
        const contingencies = (tx.contingencies || '').toUpperCase();
        items = [
            { title: 'Collect fully signed contract and earnest-money deposit', due: start + 2 * DAY, priority: 'URGENT' },
            { title: 'Send contract to attorney / title company', due: start + 2 * DAY, priority: 'HIGH' },
            { title: 'Schedule home inspection', due: start + 5 * DAY, priority: 'HIGH' },
        ];
        if (contingencies.includes('FINANCING') || !contingencies) {
            items.push({ title: 'Confirm mortgage application and commitment letter', due: start + 21 * DAY, priority: 'HIGH' });
        }
        if (contingencies.includes('APPRAISAL')) {
            items.push({ title: 'Confirm appraisal ordered and completed', due: start + 14 * DAY, priority: 'MEDIUM' });
        }
        if (contingencies.includes('SALE_OF_HOME')) {
            items.push({ title: "Track progress on buyer's home sale", due: start + 30 * DAY, priority: 'MEDIUM' });
        }
        items.push(
            { title: 'Prepare and submit board / HOA package (if co-op or condo)', due: start + 14 * DAY, priority: 'MEDIUM' },
            { title: 'Order title search and resolve any exceptions', due: start + 10 * DAY, priority: 'MEDIUM' },
            { title: 'Confirm closing date, location and funds with all parties', due: closing ? closing - 3 * DAY : null, priority: 'HIGH' },
            { title: 'Schedule final walk-through', due: closing ? closing - 1 * DAY : null, priority: 'MEDIUM' },
            { title: 'Send closing gift and ask for a review / referral', due: closing ? closing + 3 * DAY : null, priority: 'LOW' },
        );
    }

    await prisma.task.createMany({
        data: items.map(i => ({
            title: i.title,
            priority: i.priority,
            dueDate: i.due ? new Date(i.due) : null,
            linkedTransactionId: tx.id,
            linkedClientId: tx.clientId,
            linkedPropertyId: tx.propertyId,
            agentId: tx.agentId,
            orgId: tx.orgId,
        })),
    });
    return items.length;
}

/**
 * Keeps the listing and client in step with the deal stage, and creates the
 * agent's commission record when the deal closes (once per deal + agent).
 */
export async function onTransactionStatusChange(tx: Transaction, previous: string | null) {
    if (tx.status === previous) return;

    if (['IN_CONTRACT', 'BOARD_PACKAGE', 'CLEARED_TO_CLOSE'].includes(tx.status)) {
        await prisma.property.updateMany({ where: { id: tx.propertyId, status: { in: ['ACTIVE', 'COMING_SOON'] } }, data: { status: 'IN_CONTRACT' } });
        await prisma.client.updateMany({ where: { id: tx.clientId, status: { notIn: ['CLOSED', 'ARCHIVED'] } }, data: { status: 'IN_CONTRACT', funnelStage: 'IN_CONTRACT' } });
    } else if (tx.status === 'CLOSED') {
        await prisma.property.update({ where: { id: tx.propertyId }, data: { status: 'SOLD' } });
        await prisma.client.update({ where: { id: tx.clientId }, data: { status: 'CLOSED', funnelStage: 'CLOSED' } });
        if (!tx.closingDate) await prisma.transaction.update({ where: { id: tx.id }, data: { closingDate: new Date() } });
        await ensureCommission(tx);
    } else if (tx.status === 'FALLEN_THROUGH') {
        await prisma.property.updateMany({ where: { id: tx.propertyId, status: 'IN_CONTRACT' }, data: { status: 'ACTIVE' } });
        await prisma.client.updateMany({ where: { id: tx.clientId, status: 'IN_CONTRACT' }, data: { status: 'ACTIVE', funnelStage: 'SHOWING' } });
    }

    await createNotification(
        tx.agentId, tx.orgId, 'TRANSACTION_UPDATE',
        { key: 'dealStatus', params: { status: tx.status } }, undefined,
        '/transactions',
    );
}

export async function ensureCommission(tx: Transaction) {
    const org = await prisma.organization.findUnique({ where: { id: tx.orgId } });
    const rate = tx.commissionRate ?? org?.defaultCommissionRate ?? 3;
    const firmSplit = org?.defaultFirmSplit ?? 30;
    const salePrice = tx.acceptedPrice ?? tx.price;
    const gross = Math.round(salePrice * rate) / 100;

    // With a co-agent the agent-side commission is shared; each agent then pays the firm split on their part.
    const coShare = tx.coAgentId && tx.coAgentId !== tx.agentId ? Math.min(100, Math.max(0, tx.coAgentSplit ?? 50)) : 0;
    const parts: { agentId: string; share: number }[] = [{ agentId: tx.agentId, share: 100 - coShare }];
    if (coShare > 0 && tx.coAgentId) parts.push({ agentId: tx.coAgentId, share: coShare });

    const created = [];
    for (const part of parts) {
        if (part.share <= 0) continue;
        // Once per deal + agent: re-closing a deal never duplicates a commission
        const existing = await prisma.commission.findFirst({ where: { transactionId: tx.id, agentId: part.agentId } });
        if (existing) { created.push(existing); continue; }
        const partGross = Math.round(gross * part.share) / 100;
        const net = Math.round(partGross * (100 - firmSplit)) / 100;
        created.push(await prisma.commission.create({
            data: {
                transactionId: tx.id,
                agentId: part.agentId,
                orgId: tx.orgId,
                grossAmount: partGross,
                firmSplitPercent: firmSplit,
                overridePercent: 0,
                netPayout: net,
                status: 'PENDING',
                notes: `Auto-created at closing: ${rate}% of $${salePrice.toLocaleString()}`
                    + (parts.length > 1 ? `, ${part.share}% agent-side share` : '')
                    + `, firm split ${firmSplit}%`,
            },
        }));
    }
    return created[0];
}
