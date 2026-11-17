import type { Metadata } from 'next';
import HomePage from '@/components/landing/HomePage';
import { homeMetadata } from '@/lib/site';

// The home page in zh-TW: its own address, generated in that language (see components/landing/LanguageHome.tsx)
export const metadata: Metadata = homeMetadata("zh-TW");

export default function HomeZhTW() {
  return <HomePage lang="zh-TW" />;
}
