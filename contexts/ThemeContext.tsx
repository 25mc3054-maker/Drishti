"use client";

import { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'dark' | 'light';

export type Theme = AppTheme;

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: AppTheme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'dark',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'drishti_global_theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<AppTheme>(defaultTheme);

  useEffect(() => {
    try {
      const storedTheme = (localStorage.getItem(storageKey) ||
        localStorage.getItem('easytrader_theme') ||
        localStorage.getItem('vite-ui-theme')) as AppTheme | null;
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setTheme(storedTheme);
      } else {
        setTheme('dark');
      }
    } catch {
      setTheme('dark');
    }
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: AppTheme) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, newTheme);
          localStorage.setItem('easytrader_theme', newTheme);
          localStorage.setItem('vite-ui-theme', newTheme);
        } catch {}
      }
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
