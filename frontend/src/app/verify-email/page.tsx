"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token provided.'); return; }
    fetch(`${API}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.message?.includes('verified')) {
          setStatus('success');
          setTimeout(() => router.push('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      })
      .catch(() => { setStatus('error'); setMessage('Network error'); });
  }, [token, router, API]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6" />
            <p className="text-foreground/50">Verifying your email...</p>
          </>
        )}
        {status === 'success' && (
          <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="text-4xl mb-4">✓</div>
            <div className="text-green-400 font-semibold text-xl mb-2">Email Verified!</div>
            <p className="text-foreground/60 text-sm">Redirecting to login...</p>
          </div>
        )}
        {status === 'error' && (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="text-4xl mb-4 text-red-400">✕</div>
            <div className="text-red-400 font-semibold text-xl mb-2">Verification Failed</div>
            <p className="text-foreground/60 text-sm mb-4">{message}</p>
            <Link href="/login" className="text-primary hover:underline text-sm uppercase tracking-widest">Back to Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
