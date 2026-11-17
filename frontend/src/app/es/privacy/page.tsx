import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { legalMetadata } from '@/lib/legalMeta';

// The privacy policy in es (one address per language; see components/i18n/LanguagePage.tsx)
export const metadata: Metadata = legalMetadata("privacy", "es");

export default function PrivacyEs() {
  return <LegalPage doc="privacy" lang="es" />;
}
