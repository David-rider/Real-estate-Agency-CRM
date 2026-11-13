// Display helpers for values the API returns in a fixed (English) form.
const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Mar" → the short month name in the UI language ("3月", "mar.", …); other values pass through. */
export function monthLabel(m: string, lang: string): string {
  const i = EN_MONTHS.indexOf(m);
  if (i < 0) return m;
  return new Intl.DateTimeFormat(lang, { month: "short" }).format(new Date(2026, i, 15));
}

/** A stored lead source shown in the UI language; custom sources pass through unchanged. */
export function sourceLabel(map: Record<string, string>, s: string): string {
  return map[s] ?? s;
}
