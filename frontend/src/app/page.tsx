import type { Metadata } from 'next';
import HomePage from '@/components/landing/HomePage';
import { homeMetadata } from '@/lib/site';

// The home page in en: its own address, generated in that language (see components/landing/LanguageHome.tsx)
export const metadata: Metadata = homeMetadata("en");

export default function LandingPage() {
  return <HomePage lang="en" />;
}
