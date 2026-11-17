import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { legalMetadata } from '@/lib/legalMeta';

// The privacy policy in zh-CN (one address per language; see components/i18n/LanguagePage.tsx)
export const metadata: Metadata = legalMetadata("privacy", "zh-CN");

export default function PrivacyZhCN() {
  return <LegalPage doc="privacy" lang="zh-CN" />;
}
