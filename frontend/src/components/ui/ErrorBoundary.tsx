"use client";
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xl mb-6">!</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
          <p className="text-foreground/50 text-sm mb-6 max-w-sm">An unexpected error occurred. Please refresh the page or contact support if the issue persists.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-primary text-background text-sm uppercase tracking-widest font-semibold rounded hover:opacity-90 transition"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
