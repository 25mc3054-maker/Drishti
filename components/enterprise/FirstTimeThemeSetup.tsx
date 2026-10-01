"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Check, ArrowRight } from 'lucide-react';

interface FirstTimeThemeSetupProps {
  isOpen: boolean;
  currentTheme: 'dark' | 'light';
  onSelectTheme: (theme: 'dark' | 'light') => void;
  onConfirm: () => void;
}

const themeCards = [
  { id: 'dark', name: 'Dark (Black)', tag: 'Pure Black & White Focus', icon: Moon, selectedClass: 'border-white bg-zinc-900 ring-2 ring-white/30', previewClass: 'bg-black' },
  { id: 'light', name: 'Light (White)', tag: 'Clean Day Clarity', icon: Sun, selectedClass: 'border-black bg-zinc-100 ring-2 ring-black/20', previewClass: 'bg-white' },
] as const;

export function FirstTimeThemeSetup({
  isOpen,
  currentTheme,
  onSelectTheme,
  onConfirm,
}: FirstTimeThemeSetupProps) {
  const isLight = currentTheme === 'light';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-all duration-300"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`relative z-10 w-full max-w-xl overflow-hidden rounded-[28px] border shadow-2xl transition-all duration-300 ${
            isLight
              ? 'bg-white text-zinc-900 border-zinc-200 shadow-zinc-300/40'
              : 'bg-zinc-950 text-white border-zinc-800 shadow-black'
          }`}
        >
          <div className="p-6 sm:p-8">
            <div className="text-center">
              <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.18em] uppercase mb-3 ${isLight ? 'border-zinc-300 bg-zinc-100 text-zinc-800' : 'border-zinc-800 bg-zinc-900 text-zinc-300'}`}>
                Theme Preference
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Choose your theme
              </h2>
              <p className={`mx-auto mt-2 max-w-md text-xs sm:text-sm leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Standard, clean, descent black and white interface for your billing desk and inventory.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {themeCards.map(({ id, name, tag, icon: Icon, selectedClass, previewClass }) => {
                const selected = currentTheme === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectTheme(id)}
                    className={`group relative overflow-hidden rounded-2xl border-2 p-3.5 text-left transition-all duration-200 ${selected ? selectedClass : isLight ? 'border-zinc-200 bg-zinc-50 hover:border-zinc-300' : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 opacity-90 hover:opacity-100'}`}
                  >
                    <div className={`h-24 w-full overflow-hidden rounded-xl border ${isLight ? 'border-zinc-200' : 'border-zinc-800'} ${previewClass}`}>
                      <div className="flex items-center justify-between border-b border-zinc-500/20 px-2.5 py-2">
                        <div className="flex gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-zinc-400" />
                          <span className="h-2 w-2 rounded-full bg-zinc-400" />
                          <span className="h-2 w-2 rounded-full bg-zinc-400" />
                        </div>
                        <span className="h-1.5 w-12 rounded-full bg-zinc-500/30" />
                      </div>
                      <div className="flex h-[60px] items-center gap-2 p-2.5">
                        <div className="flex h-full w-8 flex-col items-center justify-center gap-1 rounded-lg bg-zinc-500/10 p-1">
                          <span className="h-1.5 w-3 rounded-full bg-zinc-400" />
                          <span className="h-1.5 w-3 rounded-full bg-zinc-400/40" />
                        </div>
                        <div className="flex flex-1 flex-col gap-1.5">
                          <div className="h-5 rounded-md bg-zinc-500/20" />
                          <div className="h-3 w-2/3 rounded-md bg-zinc-500/20" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${id === 'dark' ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-black'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className={`text-sm font-bold tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>{name}</div>
                          <div className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{tag}</div>
                        </div>
                      </div>

                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? (isLight ? 'border-black bg-black text-white' : 'border-white bg-white text-black') : isLight ? 'border-zinc-300 bg-white' : 'border-zinc-700 bg-transparent'}`}>
                        {selected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={onConfirm}
                className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-bold tracking-wide shadow-lg transition-all duration-200 hover:scale-[1.005] active:scale-[0.995] ${
                  isLight
                    ? 'bg-black text-white hover:bg-zinc-800'
                    : 'bg-white text-black hover:bg-zinc-200'
                }`}
              >
                <span>Save & Enter Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
