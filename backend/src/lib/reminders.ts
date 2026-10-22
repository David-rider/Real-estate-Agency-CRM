import { prisma } from '../server';
import { createNotification } from '../routes/notifications';

const HOUR = 60 * 60 * 1000;

/**
 * Sends each agent an in-app reminder ~24h before their appointments.
 * Runs on an interval inside the API process; `reminderSent` makes it idempotent.
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
    return due.length;
}

export function startReminderLoop(intervalMs = 10 * 60 * 1000) {
    const tick = () => sendAppointmentReminders().catch(err => console.error('Reminder job failed:', err));
    setTimeout(tick, 30 * 1000);
    return setInterval(tick, intervalMs);
}
