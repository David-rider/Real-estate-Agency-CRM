import { prisma } from '../server';
import { createNotification } from '../routes/notifications';
import { normalizePreferences } from './policies';
import { billingStart, graceEndsAt, reminderStage, nextReconcileAt, FREE_ROLES } from './billing';
import { sendEmail, billingReminderEmail } from './email';
import { EMAIL, normalizeLang } from './messages';
import { appUrl } from './appUrl';
import { reconcileCompanyBilling, endExpiredTrials } from '../routes/payments';

const HOUR = 60 * 60 * 1000;

/**
 * Sends each agent an in-app + email reminder before their appointments (24h by default; each agent can choose
 * 1, 2, 4, 12 or 24 hours in Settings > Appointments > My preferences),
 * and alerts agents when a task becomes overdue (`overdueNotified` makes it idempotent).
 */
export async function sendAppointmentReminders() {
    const now = new Date();
    const due = await prisma.appointment.findMany({
        where: {
            reminderSent: false,
            status: { in: ['SCHEDULED', 'CONFIRMED', 'RESCHEDULED'] },
            date: { gt: now, lte: new Date(now.getTime() + 24 * HOUR) },
        },
        include: {
            client:   { select: { firstName: true, lastName: true } },
            property: { select: { address: true } },
            agent:    { select: { preferences: true } },
        },
        orderBy: { date: 'asc' },
        take: 200,
    });
    let reminded = 0;
    for (const a of due) {
        // Not yet inside this agent's chosen reminder window
        const leadHours = normalizePreferences(a.agent.preferences).appointments.reminderLeadHours;
        if (a.date.getTime() - now.getTime() > leadHours * HOUR) continue;
        reminded++;
        const who = a.client ? `${a.client.firstName} ${a.client.lastName}` : '';
        const where = a.property ? a.property.address : a.location ?? '';
        await createNotification(a.agentId, a.orgId, 'APPOINTMENT_REMINDER',
            { key: 'appointmentUpcoming', params: { title: a.title, who, where, date: a.date } }, undefined, '/appointments');
        await prisma.appointment.update({ where: { id: a.id }, data: { reminderSent: true } });
    }

    const overdueTasks = await prisma.task.findMany({
        where: {
            overdueNotified: false,
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            dueDate: { lt: now },
        },
        take: 200,
    });
    for (const t of overdueTasks) {
        await createNotification(
            t.agentId,
            t.orgId,
            'TASK_DUE',
            { key: 'taskOverdue', params: { title: t.title, date: t.dueDate } },
            undefined,
            t.linkedClientId ? `/client?id=${t.linkedClientId}` : '/tasks',
        );
        await prisma.task.update({ where: { id: t.id }, data: { overdueNotified: true } });
    }

    return reminded + overdueTasks.length;
}

/**
 * Emails members who are still on the free plan in a team of two or more, before their 30-day grace period ends
 * (14, 7, 3 and 1 days left) and once when a plan has become required. Does nothing until billing has started.
 * `billingReminderStage` makes it idempotent. Members whose brokerage pays for them already have a plan and are skipped.
 */
export async function sendBillingReminders(now = new Date()) {
    const start = billingStart(now);
    if (!start) return 0;
    const members = await prisma.user.findMany({
        where: { isActive: true, tier: 'CORE', role: { notIn: FREE_ROLES as any }, createdAt: { lt: start } },
        select: { id: true, name: true, email: true, role: true, tier: true, createdAt: true, orgId: true, preferredLanguage: true, billingReminderStage: true },
        take: 500,
    });
    const teamSize = new Map<string, number>();
    let sent = 0;
    for (const m of members) {
        const end = graceEndsAt(m, start);
        if (!end) continue;
        const stage = reminderStage(end, m.billingReminderStage, now);
        if (stage === null) continue;
        if (!teamSize.has(m.orgId)) {
            teamSize.set(m.orgId, await prisma.user.count({ where: { orgId: m.orgId, isActive: true, role: { notIn: FREE_ROLES as any } } }));
        }
        if ((teamSize.get(m.orgId) || 0) < 2) continue; // working alone stays free
        const lang = normalizeLang(m.preferredLanguage);
        const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (24 * HOUR)));
        const date = end.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
        // Record first: a mail-provider failure must not turn into the same reminder every 10 minutes
        await prisma.user.update({ where: { id: m.id }, data: { billingReminderStage: stage } });
        await sendEmail({
            to: m.email,
            subject: daysLeft > 0 ? EMAIL[lang].billing.subject(daysLeft) : EMAIL[lang].billing.subjectNow,
            html: billingReminderEmail({ name: m.name, date, daysLeft, upgradeUrl: `${appUrl()}/upgrade` }, lang),
        }).catch(err => console.error(`Billing reminder to user ${m.id} failed:`, err?.message || err));
        sent++;
    }
    return sent;
}

export function startReminderLoop(intervalMs = 10 * 60 * 1000) {
    // Brokerage-paid seats are checked against Stripe once a day (and shortly after every start, so a restart never delays it)
    let reconcileAt = 0;
    const tick = () => {
        sendAppointmentReminders().catch(err => console.error('Reminder job failed:', err));
        sendBillingReminders().catch(err => console.error('Billing reminder job failed:', err));
        endExpiredTrials().catch(err => console.error('Trial expiry job failed:', err));
        if (Date.now() >= reconcileAt) {
            const ranAt = Date.now();
            reconcileAt = nextReconcileAt(ranAt, 0);
            reconcileCompanyBilling()
                .then(r => { reconcileAt = nextReconcileAt(ranAt, r.failed); })
                .catch(err => { reconcileAt = nextReconcileAt(ranAt, 1); console.error('[billing-reconcile] job failed:', err); });
        }
    };
    setTimeout(tick, 30 * 1000);
    return setInterval(tick, intervalMs);
}
