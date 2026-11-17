import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { legalMetadata } from '@/lib/legalMeta';

// The privacy policy in en (one address per language; see components/i18n/LanguagePage.tsx)
export const metadata: Metadata = legalMetadata("privacy", "en");

export default function PrivacyPage() {
  return <LegalPage doc="privacy" lang="en" />;
}
