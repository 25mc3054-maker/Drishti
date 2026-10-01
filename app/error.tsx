"use client";

import { useEffect } from 'react';
import { RefreshCw, AlertTriangle, RotateCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Route Error:', error);
  }, [error]);

  const handleResetCache = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('drishti_cached_dashboard_data');
      } catch {}
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-950/90 backdrop-blur-xl p-6 sm:p-8 text-center shadow-2xl space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Temporary View Error</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {error?.message || 'An unexpected rendering issue occurred. Click reload to refresh this section.'}
        </p>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
          <button
            onClick={handleResetCache}
            className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 font-bold text-xs hover:bg-zinc-800 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear Cache
          </button>
        </div>
      </div>
    </div>
  );
}
