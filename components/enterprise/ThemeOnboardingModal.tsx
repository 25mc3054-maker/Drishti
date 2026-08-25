"use client";

import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

type ThemeOnboardingModalProps = {
  onComplete: () => void;
};

export function ThemeOnboardingModal({ onComplete }: ThemeOnboardingModalProps) {
  const { setTheme } = useTheme();

  const selectTheme = (theme: 'light' | 'dark') => {
    setTheme(theme);
    localStorage.setItem('theme_onboarding_complete', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-[min(90vw,400px)] rounded-lg border border-foreground/10 bg-background p-6 text-foreground"
      >
        <h2 className="text-xl font-semibold">Choose Your Theme</h2>
        <p className="mt-2 text-foreground/70">
          Select your preferred theme to get started.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => selectTheme('light')}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-foreground/10 p-6 transition hover:bg-foreground/5"
          >
            <Sun className="h-8 w-8" />
            <span className="font-semibold">Light Mode</span>
          </button>
          <button
            onClick={() => selectTheme('dark')}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-foreground/10 p-6 transition hover:bg-foreground/5"
          >
            <Moon className="h-8 w-8" />
            <span className="font-semibold">Dark Mode</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
