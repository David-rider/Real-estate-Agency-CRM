"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('sent');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Something went wrong');
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

        {status === 'sent' ? (
          <div className="mt-8 p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="text-green-400 font-semibold mb-2">Check your inbox</div>
            <p className="text-foreground/60 text-sm">If <strong>{email}</strong> is registered, a password reset link has been sent. Check your spam folder if you don&apos;t see it.</p>
          </div>
        ) : (
          <>
            <div className="mt-8 mb-10">
              <div className="w-12 h-12 bg-surface border border-border flex items-center justify-center font-serif text-2xl text-primary mb-8">C</div>
              <h1 className="text-3xl font-bold text-foreground mb-3">Forgot password?</h1>
              <p className="text-sm text-foreground/50 border-l-2 border-primary/50 pl-4">Enter your email and we&apos;ll send a reset link.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {status === 'error' && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm tracking-widest uppercase">{errorMsg}</div>
              )}
              <div className="space-y-2 group">
                <label className="block font-sans text-sm uppercase tracking-widest text-foreground/50 transition-colors group-focus-within:text-primary">Email</label>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-0 py-3 bg-transparent border-b border-border focus:border-primary outline-none transition-colors text-foreground"
                  placeholder="agent@xyz.com"
                />
              </div>
              <button
                type="submit" disabled={status === 'loading'}
                className="w-full py-3 bg-primary text-background rounded-lg text-sm uppercase tracking-widest font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
              >
                {status === 'loading' ? <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : 'Send Reset Link →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
