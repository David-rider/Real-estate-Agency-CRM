import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { legalMetadata } from '@/lib/legalMeta';

// The terms of service in zh-CN (one address per language; see components/i18n/LanguagePage.tsx)
export const metadata: Metadata = legalMetadata("terms", "zh-CN");

export default function TermsZhCN() {
  return <LegalPage doc="terms" lang="zh-CN" />;
}
