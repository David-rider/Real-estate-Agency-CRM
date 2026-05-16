"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!token) router.push('/forgot-password');
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setErrorMsg('Passwords do not match'); setStatus('error'); return; }
    if (password.length < 8) { setErrorMsg('Password must be at least 8 characters'); setStatus('error'); return; }
    setStatus('loading');
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setErrorMsg(data.error || 'Reset failed');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-md">
        <Link href="/login" className="text-sm text-foreground/50 hover:text-primary uppercase tracking-widest mb-8 inline-flex items-center gap-2 transition-colors">
          ← Back to login
        </Link>

        {status === 'success' ? (
          <div className="mt-8 p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="text-green-400 font-semibold mb-2">Password updated!</div>
            <p className="text-foreground/60 text-sm">Redirecting you to login...</p>
          </div>
        ) : (
          <>
            <div className="mt-8 mb-10">
              <div className="w-12 h-12 bg-surface border border-border flex items-center justify-center font-serif text-2xl text-primary mb-8">C</div>
              <h1 className="text-3xl font-bold text-foreground mb-3">Set new password</h1>
              <p className="text-sm text-foreground/50 border-l-2 border-primary/50 pl-4">Choose a strong password of at least 8 characters.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {status === 'error' && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm tracking-widest uppercase">{errorMsg}</div>
              )}
              <div className="space-y-2 group">
                <label className="block font-sans text-sm uppercase tracking-widest text-foreground/50 group-focus-within:text-primary">New Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-0 py-3 bg-transparent border-b border-border focus:border-primary outline-none transition-colors text-foreground" placeholder="••••••••" />
              </div>
              <div className="space-y-2 group">
                <label className="block font-sans text-sm uppercase tracking-widest text-foreground/50 group-focus-within:text-primary">Confirm Password</label>
                <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="w-full px-0 py-3 bg-transparent border-b border-border focus:border-primary outline-none transition-colors text-foreground" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={status === 'loading'}
                className="w-full py-3 bg-primary text-background rounded-lg text-sm uppercase tracking-widest font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-3 mt-4">
                {status === 'loading' ? <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : 'Update Password →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
