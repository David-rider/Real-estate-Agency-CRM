import type { Metadata } from 'next';
import HomePage from '@/components/landing/HomePage';
import { homeMetadata } from '@/lib/site';

// The home page in zh-CN: its own address, generated in that language (see components/landing/LanguageHome.tsx)
export const metadata: Metadata = homeMetadata("zh-CN");

export default function HomeZhCN() {
  return <HomePage lang="zh-CN" />;
}
