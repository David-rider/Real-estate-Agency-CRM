"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useI18n } from "@/lib/i18n/I18nContext";
import Link from "next/link";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    orgName: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { t, language, setLanguage } = useI18n();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        login(data.token, data.user);
      } else {
        setError(data.error || t.signup.registrationFailed);
      }
    } catch (err) {
      setError(t.signup.serverError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    try {
      const simulatedOAuthProfile = {
        email: `demo.${provider}@example.com`,
        name: `Demo ${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        [`${provider}Id`]: `mock-${provider}-id-12345`
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/oauth/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(simulatedOAuthProfile),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        login(data.token, data.user);
      } else {
        setError(data.error || t.signup.registrationFailed);
      }
    } catch (err) {
      setError(t.signup.serverError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-foreground bg-background">
      <div className="w-full md:w-1/2 flex flex-col justify-center p-8 lg:p-24 border-r border-border animate-in fade-in slide-in-from-left-8 duration-700">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-12">
            <div className="w-12 h-12 bg-surface border border-border flex items-center justify-center font-serif text-2xl text-primary mb-8">
              C
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl font-light text-foreground mb-4">
              {t.signup.title}
            </h1>
            <p className="font-sans text-sm tracking-wide text-foreground/50 border-l-2 border-primary/50 pl-4">
              {t.signup.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 font-sans text-xs tracking-widest uppercase mb-6">
                {error}
              </div>
            )}

            <div className="space-y-2 group">
              <label className="block font-sans text-xs uppercase tracking-widest text-foreground/50 transition-colors group-focus-within:text-primary">
                {t.signup.fullName}
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-0 py-3 bg-transparent border-b border-border focus:border-primary outline-none transition-colors font-sans text-base text-foreground placeholder:text-foreground/20"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2 group">
              <label className="block font-sans text-xs uppercase tracking-widest text-foreground/50 transition-colors group-focus-within:text-primary">
                {t.login.email}
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-0 py-3 bg-transparent border-b border-border focus:border-primary outline-none transition-colors font-sans text-base text-foreground placeholder:text-foreground/20"
                placeholder="agent@cpre.com"
              />
            </div>

            <div className="space-y-2 group">
              <label className="block font-sans text-xs uppercase tracking-widest text-foreground/50 transition-colors group-focus-within:text-primary">
                {t.signup.org}
              </label>
              <input
                type="text"
                name="orgName"
                required
                value={formData.orgName}
                onChange={handleChange}
                className="w-full px-0 py-3 bg-transparent border-b border-border focus:border-primary outline-none transition-colors font-sans text-base text-foreground placeholder:text-foreground/20"
                placeholder={t.signup.orgPlaceholder}
              />
            </div>

            <div className="space-y-2 group pb-4">
              <label className="block font-sans text-xs uppercase tracking-widest text-foreground/50 transition-colors group-focus-within:text-primary">
                {t.signup.password}
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-0 py-3 bg-transparent border-b border-border focus:border-primary outline-none transition-colors font-sans text-base text-foreground placeholder:text-foreground/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary text-background rounded-none text-sm uppercase tracking-widest font-medium transition-all hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-3 group mt-8"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <>
                  {t.signup.createAccount}
                  <span className="transform group-hover:translate-x-1 transition-transform font-serif">
                    &rarr;
                  </span>
                </>
              )}
            </button>

            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-foreground/30 text-xs font-sans tracking-widest">
                OR
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
                className="w-full py-3 bg-surface border border-border text-foreground hover:bg-background transition-colors text-sm uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  <path d="M1 1h22v22H1z" fill="none"/>
                </svg>
                {t.login.continueGoogle}
              </button>

              <button
                type="button"
                onClick={() => handleOAuthLogin('apple')}
                disabled={isLoading}
                className="w-full py-3 bg-surface border border-border text-foreground hover:bg-background transition-colors text-sm uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5 placeholder:text-foreground" viewBox="0 0 384 512" fill="currentColor">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
                {t.login.continueApple}
              </button>
            </div>
          </form>

          <div className="mt-12 pt-8 border-t border-border flex flex-col gap-4 font-sans text-sm text-foreground/50">
            <p>
              {t.signup.hasAccount}{" "}
              <Link
                href="/login"
                className="text-primary hover:underline uppercase tracking-widest text-xs font-medium"
              >
                {t.signup.signIn}
              </Link>
            </p>
            <div className="flex gap-4 items-center">
              <span className="text-xs uppercase tracking-widest">
                {t.login.language}
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent border-b border-border text-foreground outline-none text-sm pb-1 cursor-pointer hover:border-primary transition-colors focus:border-primary"
              >
                <option value="en" className="bg-surface">
                  English
                </option>
                <option value="zh" className="bg-surface">
                  中文 (Simplified)
                </option>
                <option value="es" className="bg-surface">
                  Español
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:flex w-1/2 bg-surface items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20 filter grayscale" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="relative z-10 max-w-lg p-12 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 transform translate-y-8">
          <h2 className="font-serif text-5xl text-foreground font-light leading-tight mb-8">
            {t.signup.heroTitleP1}{" "}
            <span className="text-primary italic">{t.signup.heroTitleP2}</span>
          </h2>
          <div className="w-24 h-[1px] bg-primary mb-8" />
          <p className="font-sans text-lg text-foreground/60 leading-relaxed font-light">
            {t.signup.heroSubtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
