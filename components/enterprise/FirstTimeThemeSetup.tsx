"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Check, ArrowRight } from 'lucide-react';

interface FirstTimeThemeSetupProps {
  isOpen: boolean;
  currentTheme: 'dark' | 'light';
  onSelectTheme: (theme: 'dark' | 'light') => void;
  onConfirm: () => void;
}

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
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-xl transition-all duration-300"
        />

        {/* Modal Card - Sharp Edge Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`relative z-10 w-full max-w-xl overflow-hidden rounded-none border shadow-2xl transition-all duration-300 ${
            isLight
              ? 'bg-white text-zinc-900 border-zinc-300 shadow-2xl shadow-zinc-400/30'
              : 'bg-[#0b0d11] text-white border-zinc-800 shadow-2xl shadow-black'
          }`}
        >
          {/* Subtle Ambient Top Glow */}
          <div
            className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 opacity-20 transition-colors ${
              isLight ? 'bg-amber-400 blur-3xl' : 'bg-emerald-500 blur-3xl'
            }`}
          />

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold tracking-wider uppercase mb-3 border transition-colors bg-white/5 border-white/10 text-zinc-400">
                Workspace Experience
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Choose Your Workspace Theme
              </h2>
              <p className={`mt-2 text-xs sm:text-sm max-w-md mx-auto leading-relaxed transition-colors ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Select your everyday visual preference. Your choice applies permanently across all dashboards, inventory, and billing tools.
              </p>
            </div>

            {/* Interactive Visual UI Preview Cards - Sharp Edges */}
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* DARK THEME OPTION */}
              <button
                type="button"
                onClick={() => onSelectTheme('dark')}
                className={`group relative flex flex-col rounded-none border-2 p-4 text-left transition-all duration-200 cursor-pointer overflow-hidden ${
                  currentTheme === 'dark'
                    ? 'border-emerald-500 bg-zinc-900 shadow-lg shadow-emerald-950/30 ring-2 ring-emerald-500/30'
                    : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700 hover:bg-zinc-900/60 opacity-75 hover:opacity-100'
                }`}
              >
                {/* Mini Window Preview: Dark Mode */}
                <div className="h-28 w-full rounded-none bg-[#090a0f] border border-zinc-800 p-2.5 flex flex-col justify-between overflow-hidden">
                  {/* Mock Window Top Bar */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-red-500/80" />
                      <div className="w-1.5 h-1.5 bg-yellow-500/80" />
                      <div className="w-1.5 h-1.5 bg-green-500/80" />
                    </div>
                    <div className="h-1.5 w-12 bg-zinc-800" />
                  </div>

                  {/* Mock Content Layout */}
                  <div className="flex gap-2 h-14 items-center">
                    {/* Mock Mini Sidebar */}
                    <div className="w-4 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col gap-1 p-0.5 justify-center items-center">
                      <div className="w-2.5 h-1 bg-emerald-400" />
                      <div className="w-2.5 h-1 bg-zinc-700" />
                      <div className="w-2.5 h-1 bg-zinc-700" />
                    </div>
                    {/* Mock Mini Cards */}
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="flex gap-1.5">
                        <div className="flex-1 h-6 bg-zinc-900 border border-zinc-800 p-1 flex flex-col justify-center">
                          <div className="w-6 h-1 bg-emerald-400/80" />
                        </div>
                        <div className="flex-1 h-6 bg-zinc-900 border border-zinc-800 p-1 flex flex-col justify-center">
                          <div className="w-4 h-1 bg-zinc-600" />
                        </div>
                      </div>
                      <div className="h-4 bg-zinc-900/60 border border-zinc-800/50 flex items-center px-1">
                        <div className="w-14 h-1 bg-zinc-700" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Title & Sharp Checkbox */}
                <div className="mt-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-zinc-800 border border-zinc-700 text-emerald-400">
                      <Moon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white tracking-tight">Dark Theme</div>
                      <div className="text-[11px] text-zinc-400">Deep obsidian & low fatigue</div>
                    </div>
                  </div>
                  <div
                    className={`h-5 w-5 border flex items-center justify-center transition-colors ${
                      currentTheme === 'dark'
                        ? 'border-emerald-500 bg-emerald-500 text-black'
                        : 'border-zinc-700 bg-transparent'
                    }`}
                  >
                    {currentTheme === 'dark' && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </div>
              </button>

              {/* LIGHT THEME OPTION */}
              <button
                type="button"
                onClick={() => onSelectTheme('light')}
                className={`group relative flex flex-col rounded-none border-2 p-4 text-left transition-all duration-200 cursor-pointer overflow-hidden ${
                  currentTheme === 'light'
                    ? 'border-amber-500 bg-white shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                    : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700 hover:bg-zinc-900/60 opacity-75 hover:opacity-100'
                }`}
              >
                {/* Mini Window Preview: Light Mode */}
                <div className="h-28 w-full rounded-none bg-zinc-100 border border-zinc-300 p-2.5 flex flex-col justify-between overflow-hidden">
                  {/* Mock Window Top Bar */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-300">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-red-400" />
                      <div className="w-1.5 h-1.5 bg-yellow-400" />
                      <div className="w-1.5 h-1.5 bg-green-400" />
                    </div>
                    <div className="h-1.5 w-12 bg-zinc-300" />
                  </div>

                  {/* Mock Content Layout */}
                  <div className="flex gap-2 h-14 items-center">
                    {/* Mock Mini Sidebar */}
                    <div className="w-4 h-full bg-zinc-200 border-r border-zinc-300 flex flex-col gap-1 p-0.5 justify-center items-center">
                      <div className="w-2.5 h-1 bg-amber-500" />
                      <div className="w-2.5 h-1 bg-zinc-400" />
                      <div className="w-2.5 h-1 bg-zinc-400" />
                    </div>
                    {/* Mock Mini Cards */}
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="flex gap-1.5">
                        <div className="flex-1 h-6 bg-white border border-zinc-300 p-1 flex flex-col justify-center">
                          <div className="w-6 h-1 bg-amber-500" />
                        </div>
                        <div className="flex-1 h-6 bg-white border border-zinc-300 p-1 flex flex-col justify-center">
                          <div className="w-4 h-1 bg-zinc-400" />
                        </div>
                      </div>
                      <div className="h-4 bg-white border border-zinc-300 flex items-center px-1">
                        <div className="w-14 h-1 bg-zinc-300" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Title & Sharp Checkbox */}
                <div className="mt-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-100 border border-amber-300 text-amber-600">
                      <Sun className="h-4 w-4" />
                    </div>
                    <div>
                      <div className={`text-sm font-bold tracking-tight ${isLight && currentTheme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                        Light Theme
                      </div>
                      <div className="text-[11px] text-zinc-400">Crisp daytime readability</div>
                    </div>
                  </div>
                  <div
                    className={`h-5 w-5 border flex items-center justify-center transition-colors ${
                      currentTheme === 'light'
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-zinc-700 bg-transparent'
                    }`}
                  >
                    {currentTheme === 'light' && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </div>
              </button>
            </div>

            {/* Action Button & Disclaimer - Sharp Edges */}
            <div className="mt-8">
              <button
                type="button"
                onClick={onConfirm}
                className={`w-full h-12 rounded-none text-[14px] font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer hover:scale-[1.005] active:scale-[0.995] ${
                  isLight
                    ? 'bg-zinc-900 text-white hover:bg-black'
                    : 'bg-white text-zinc-950 hover:bg-zinc-100'
                }`}
              >
                <span>Save & Enter Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className={`text-center text-[11px] mt-3 font-medium transition-colors ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                Tip: You can change themes anytime using the toggle in the top bar.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

