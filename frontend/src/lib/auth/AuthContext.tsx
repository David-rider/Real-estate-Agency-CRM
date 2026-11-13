"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { resetSettingsCache } from '@/lib/settings/useSettings';
import { saveLanguageToAccount } from '@/lib/i18n/I18nContext';
import type { Language } from '@/lib/i18n/translations';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    tier: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (newUser: User) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: () => { },
    logout: () => { },
    updateUser: () => { },
    isLoading: true,
});

// Keep the account language and this browser's language in step right after signing in:
// a language chosen on this device is saved to the account; on a device that has never chosen one,
// the language saved on the account is used.
function syncLanguage(token: string) {
    const local = localStorage.getItem('preferredLanguage');
    if (local) {
        saveLanguageToAccount(local as Language, token);
        return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/settings/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
    })
        .then((r) => (r.ok ? r.json() : null))
        .then((p) => {
            if (p?.preferredLanguage) window.dispatchEvent(new CustomEvent('crm:language', { detail: p.preferredLanguage }));
        })
        .catch(() => {});
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Hydrate from localStorage
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/public-listings', '/property', '/privacy', '/terms'];
        // "/" is the public landing page; sub-pages of public routes (e.g. a listing) are public too
        const isPublic = pathname === '/' || publicRoutes.some(r => pathname === r || pathname.startsWith(r + '/'));
        // Route protection
        if (!token && !isPublic) {
            router.push('/login');
        } else if (token && (pathname === '/login' || pathname === '/signup')) {
            router.push('/dashboard');
        }
    }, [token, pathname, isLoading, router]);


    const login = (newToken: string, newUser: User) => {
        resetSettingsCache(); // never show the previous person's brokerage policies or preferences
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        syncLanguage(newToken);
        router.push('/dashboard');
    };

    const logout = () => {
        resetSettingsCache();
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'X-CSRF-Protection': '1' },
        }).catch(() => {});
        router.push('/login');
    };

    const updateUser = (newUser: User) => {
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
