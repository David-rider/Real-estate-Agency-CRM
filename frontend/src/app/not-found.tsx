"use client";
import Link from 'next/link';
import { useExtra } from '@/lib/i18n/extra';

export default function NotFound() {
  const U = useExtra().ui;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-8">
      <div className="w-12 h-12 bg-surface border border-border flex items-center justify-center font-serif text-2xl text-primary mb-8">C</div>
      <div className="font-serif text-8xl font-bold text-foreground/10 mb-4 select-none">404</div>
      <h1 className="text-2xl font-bold text-foreground mb-3">{U.notFoundTitle}</h1>
      <p className="text-foreground/50 text-sm mb-8 max-w-sm">{U.notFoundBody}</p>
      <Link href="/dashboard" className="px-6 py-3 bg-primary text-background text-sm uppercase tracking-widest font-semibold rounded-lg hover:opacity-90 transition">
        {U.backToDashboard}
      </Link>
    </div>
  );
}
