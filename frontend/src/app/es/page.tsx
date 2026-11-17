import type { Metadata } from 'next';
import HomePage from '@/components/landing/HomePage';
import { homeMetadata } from '@/lib/site';

// The home page in es: its own address, generated in that language (see components/landing/LanguageHome.tsx)
export const metadata: Metadata = homeMetadata("es");

export default function HomeEs() {
  return <HomePage lang="es" />;
}
