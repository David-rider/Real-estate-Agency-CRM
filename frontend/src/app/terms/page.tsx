import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { legalMetadata } from '@/lib/legalMeta';

// The terms of service in en (one address per language; see components/i18n/LanguagePage.tsx)
export const metadata: Metadata = legalMetadata("terms", "en");

export default function TermsPage() {
  return <LegalPage doc="terms" lang="en" />;
}
