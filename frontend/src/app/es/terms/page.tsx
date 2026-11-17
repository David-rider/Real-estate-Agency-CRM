import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { legalMetadata } from '@/lib/legalMeta';

// The terms of service in es (one address per language; see components/i18n/LanguagePage.tsx)
export const metadata: Metadata = legalMetadata("terms", "es");

export default function TermsEs() {
  return <LegalPage doc="terms" lang="es" />;
}
