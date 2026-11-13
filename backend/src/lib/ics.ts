/** Minimal iCalendar (RFC 5545) writer for the read-only appointment feed. */
export type IcsEvent = { uid: string; start: Date; end: Date; summary: string; location?: string | null; description?: string | null; cancelled?: boolean; updated?: Date };

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

// Lines longer than 75 octets are folded with CRLF + space
function fold(line: string): string {
    const out: string[] = [];
    let cur = '';
    for (const ch of line) {
        if (Buffer.byteLength(cur + ch) > 74) { out.push(cur); cur = ' ' + ch; } else cur += ch;
    }
    out.push(cur);
    return out.join('\r\n');
}

export function buildIcs(calName: string, events: IcsEvent[]): string {
    const now = stamp(new Date());
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Real Estate CRM//Appointments//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        `X-WR-CALNAME:${esc(calName)}`, 'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H'];
    for (const e of events) {
        lines.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${now}`, `DTSTART:${stamp(e.start)}`, `DTEND:${stamp(e.end)}`, `SUMMARY:${esc(e.summary)}`);
        if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
        if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
        if (e.updated) lines.push(`LAST-MODIFIED:${stamp(e.updated)}`);
        lines.push(`STATUS:${e.cancelled ? 'CANCELLED' : 'CONFIRMED'}`, 'END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
}
