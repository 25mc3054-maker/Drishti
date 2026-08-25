"use client";

import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

type ThemeOnboardingModalProps = {
  onComplete: () => void;
  onThemeSelect?: (theme: 'light' | 'dark') => void;
};

export function ThemeOnboardingModal({ onComplete, onThemeSelect }: ThemeOnboardingModalProps) {
  const { setTheme } = useTheme();

  const selectTheme = (theme: 'light' | 'dark') => {
    setTheme(theme);
    if (onThemeSelect) {
      onThemeSelect(theme);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme_onboarding_complete', 'true');
      localStorage.setItem('easytrader_theme', theme);
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-[min(92vw,440px)] rounded-none border border-zinc-800 bg-[#000000] p-6 text-white shadow-2xl text-center"
      >
        <div className="inline-block rounded-none border border-zinc-800 bg-zinc-950 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
          WORKSPACE EXPERIENCE
        </div>
        <h2 className="text-xl font-bold uppercase tracking-wide !text-white" style={{ color: '#ffffff' }}>
          Choose Your Workspace Theme
        </h2>
        <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
          Select your everyday visual preference. Your choice applies permanently across all dashboards, inventory, and billing tools.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => selectTheme('light')}
            className="flex flex-col items-center justify-center gap-3 rounded-none border border-zinc-800 bg-zinc-950 p-6 text-zinc-200 transition hover:bg-zinc-900 hover:border-zinc-500 hover:text-white active:bg-zinc-800"
          >
            <Sun className="h-7 w-7 text-amber-400" />
            <span className="font-semibold text-xs tracking-wider uppercase">Light Mode</span>
          </button>
          <button
            type="button"
            onClick={() => selectTheme('dark')}
            className="flex flex-col items-center justify-center gap-3 rounded-none border border-zinc-800 bg-zinc-950 p-6 text-zinc-200 transition hover:bg-zinc-900 hover:border-zinc-500 hover:text-white active:bg-zinc-800"
          >
            <Moon className="h-7 w-7 text-blue-400" />
            <span className="font-semibold text-xs tracking-wider uppercase">Dark Mode</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
