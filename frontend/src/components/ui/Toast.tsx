"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const COLORS: Record<ToastType, string> = {
  success: 'border-l-green-500 bg-green-500/10 text-green-400',
  error: 'border-l-red-500 bg-red-500/10 text-red-400',
  warning: 'border-l-yellow-500 bg-yellow-500/10 text-yellow-400',
  info: 'border-l-blue-500 bg-blue-500/10 text-blue-400',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const success = useCallback((msg: string) => toast(msg, 'success'), [toast]);
  const error = useCallback((msg: string) => toast(msg, 'error'), [toast]);
  const info = useCallback((msg: string) => toast(msg, 'info'), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm px-4 py-3 border border-border border-l-4 rounded-lg shadow-lg backdrop-blur-sm animate-in slide-in-from-right-4 fade-in duration-300 ${COLORS[t.type]}`}
          >
            <span className="text-sm font-bold mt-0.5">{ICONS[t.type]}</span>
            <p className="text-sm text-foreground flex-1">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="text-foreground/40 hover:text-foreground transition-colors text-xs ml-2"
            >✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
