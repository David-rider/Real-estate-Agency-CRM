#!/usr/bin/env node
/*
 * Strict i18n scan: finds English UI text that is written straight into components instead of
 * coming from the translation files (translations.ts / extra.ts).
 *   - JSX text between tags:            <span>No Image</span>
 *   - user-facing attributes:           placeholder="Search…"  title="…"  alt="…"  aria-label="…"
 * Fallbacks such as {t.x ?? "Text"} are fine (the translation exists) and are not reported.
 * Usage: node scripts/i18n-strict.js            (exit code 1 when anything is found)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
// Words that are the same in every language (brands, acronyms, units, place names)
const ALLOW = new Set([
  'Real Estate CRM', 'CRM', 'QR', 'CSV', 'MLS', 'AI', 'PDF', 'Google', 'Apple', 'Stripe', 'Zillow', 'StreetEasy',
  'DocuSign', 'Excel', 'LinkedIn', 'Instagram', 'Facebook', 'TikTok', 'YouTube', 'WhatsApp', 'WeChat', 'iOS', 'Android',
  'EN', 'ES', 'New York', 'NY', 'NYC', 'Manhattan', 'Brooklyn', 'Queens', 'USD', 'ID', 'URL', 'API', 'HOA', 'PRO', 'ELITE', 'CORE',
  'English', 'Español', 'OK', 'AM', 'PM', 'Pro', 'Elite', 'Core', 'Gmail', 'Outlook', 'Resend', 'SendGrid', 'Twilio', 'R2',
]);
const looksEnglish = (s) => {
  const t = s.replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t || ALLOW.has(t)) return false;
  if (!/[A-Za-z]{2,}/.test(t)) return false;            // needs a real word
  if (/^[A-Z0-9_\-./:]+$/.test(t) && t.length <= 4) return false; // short codes
  if (/^(https?:|mailto:|\/|#|\.\/)/.test(t)) return false;
  if (/^[\w.+-]+@[\w.-]+$/.test(t)) return false;        // email placeholder
  if (/[;=]|^new \w+\(|\b(void|Promise|ReturnType)\b/.test(t)) return false; // code that looks like text
  if (/^(pk\.|sk-)|^[a-z0-9]+(-[a-z0-9]+)+$|^\d+ [A-Z][a-z]+ (St|Ave|Rd)/.test(t)) return false; // key formats, slugs, example addresses
  if (/^Twitter \/ X$/.test(t)) return false;
  const words = t.split(/[^A-Za-z]+/).filter(Boolean);
  return words.some((w) => !ALLOW.has(w));
};

const hits = [];
function scan(file) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    if (/i18n-ignore/.test(line)) return;
    // JSX text: >Text<  (not inside {…})
    for (const m of line.matchAll(/>([^<>{}`]+)</g)) {
      if (looksEnglish(m[1]) && !/=>|&&|\?\s|:\s*\(/.test(m[1])) hits.push(`${rel}:${i + 1}  text  ${m[1].trim()}`);
    }
    // JSX text on its own line between tags:  <span>\n   No Image\n </span>
    const trimmed = line.trim();
    if (/^[A-Za-z][A-Za-z0-9 ,.'’!?()&/:+-]*$/.test(trimmed) && !/^(import|export|return|const|let|if|else|case|default|break)\b/.test(trimmed)) {
      const prev = lines.slice(0, i).reverse().find((l) => l.trim());
      const next = lines.slice(i + 1).find((l) => l.trim());
      if (prev && /[^=]>\s*$/.test(prev) && !/=>\s*$/.test(prev) && next && /^\s*<\//.test(next) && looksEnglish(trimmed)) {
        hits.push(`${rel}:${i + 1}  text  ${trimmed}`);
      }
    }
    for (const m of line.matchAll(/\b(placeholder|title|alt|aria-label)="([^"]+)"/g)) {
      if (looksEnglish(m[2])) hits.push(`${rel}:${i + 1}  ${m[1]}  ${m[2]}`);
    }
  });
}
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (/\.tsx$/.test(f)) scan(full);
  }
}
walk(ROOT);
hits.forEach((h) => console.log(h));
console.log(`\n${hits.length} hard-coded English UI string(s)`);
process.exit(hits.length ? 1 : 0);
