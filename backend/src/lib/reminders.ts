import { prisma } from '../server';
import { createNotification } from '../routes/notifications';

const HOUR = 60 * 60 * 1000;

/**
 * Sends each agent an in-app + email reminder ~24h before their appointments,
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
        },
        take: 200,
    });
    for (const a of due) {
        const who = a.client ? ` with ${a.client.firstName} ${a.client.lastName}` : '';
        const where = a.property ? ` at ${a.property.address}` : a.location ? ` at ${a.location}` : '';
        await createNotification(a.agentId, a.orgId, 'APPOINTMENT_REMINDER', 'Upcoming appointment',
            `"${a.title}"${who}${where} — ${a.date.toISOString().replace('T', ' ').slice(0, 16)} UTC`, '/appointments');
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
            `Task overdue: ${t.title}`,
            `"${t.title}" is past its due time (${t.dueDate?.toISOString().replace('T', ' ').slice(0, 16)} UTC).`,
            t.linkedClientId ? `/crm/${t.linkedClientId}` : '/tasks',
        );
        await prisma.task.update({ where: { id: t.id }, data: { overdueNotified: true } });
    }

    return due.length + overdueTasks.length;
}

export function startReminderLoop(intervalMs = 10 * 60 * 1000) {
    const tick = () => sendAppointmentReminders().catch(err => console.error('Reminder job failed:', err));
    setTimeout(tick, 30 * 1000);
    return setInterval(tick, intervalMs);
}
