"use client";

import { useEffect } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('EasyTrader Application Error:', error);
  }, [error]);

  const handleHardReset = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('drishti_cached_dashboard_data');
      } catch {}
      window.location.href = '/';
    }
  };

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 text-center shadow-2xl space-y-5">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white">Something interrupted the workspace</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              EasyTrader encountered a client-side execution hiccup. You can instantly reload or recover the workspace below.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              onClick={() => reset()}
              className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </button>
            <button
              onClick={handleHardReset}
              className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 transition active:scale-[0.98]"
            >
              <Home className="h-4 w-4" /> Reload Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
