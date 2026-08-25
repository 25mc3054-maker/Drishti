"use client"

import { motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, Lightbulb, Orbit, Play, ShieldCheck, Target, Zap } from 'lucide-react';
import type { DashboardData, TabKey } from './types';
import { CosmicScene } from './CosmicScene';

interface HeroSectionProps {
  data: DashboardData;
  onNavigate: (tab: TabKey) => void;
  theme?: 'dark' | 'light';
}

export function HeroSection({ data, onNavigate, theme = 'dark' }: HeroSectionProps) {
  const isLight = theme === 'light';

  const capabilities = [
    {
      icon: Zap,
      title: 'Speed',
      description: 'Move from store signals to useful decisions in minutes, with clear workflows for the team.',
    },
    {
      icon: BrainCircuit,
      title: 'Deep capabilities',
      description: 'Vision, inventory, billing, customers, and operations work together as one adaptive layer.',
    },
    {
      icon: Orbit,
      title: 'Connected execution',
      description: 'Every recommendation links to the business suite, storefront, and insight dashboards.',
    },
  ];
  const businessThoughts = [
    {
      icon: Target,
      title: 'Profit follows clarity',
      description: 'Keep price, stock, credit, and customer movement visible before making the next buying decision.',
    },
    {
      icon: ShieldCheck,
      title: 'Credit needs rhythm',
      description: 'Small weekly follow-ups protect cash flow without making collection feel chaotic.',
    },
    {
      icon: Lightbulb,
      title: 'Inventory is memory',
      description: 'Every bill teaches what sells, what sits, and what should be reordered with confidence.',
    },
  ];

  return (
    <div className="space-y-7">
      <section className={`relative left-1/2 min-h-[calc(100vh-5.25rem)] w-screen -translate-x-1/2 overflow-hidden border-0 transition-colors ${
        isLight ? 'bg-white' : 'bg-black'
      }`}>
        {!isLight && <CosmicScene />}
        <div className="pointer-events-none absolute inset-0 bg-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5.25rem)] w-full max-w-[1180px] flex-col items-center justify-center px-4 pb-40 pt-24 text-center md:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 22, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.65, delay: 0.08, ease: 'easeOut' }}
            className={`max-w-[15ch] text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-[54px] md:text-[72px] lg:text-[92px] ${
              isLight ? '!text-slate-900' : '!text-white'
            }`}
            style={{ color: isLight ? '#0f172a' : '#ffffff' }}
          >
            Everything Your Business Needs. One Platform.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.2, ease: 'easeOut' }}
            className={`mt-6 max-w-2xl text-[17px] font-medium leading-8 md:text-[19px] ${
              isLight ? 'text-slate-700' : 'text-white/80'
            }`}
          >
            EasyTrader turns visual operations, inventory, billing, and customer signals into calm, actionable intelligence for growing businesses.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.3, ease: 'easeOut' }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <button
              type="button"
              onClick={() => onNavigate('business-suite')}
              className={`group inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[14px] font-bold shadow-md transition hover:scale-[1.02] ${
                isLight
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-white/25 bg-white text-black shadow-[0_0_34px_rgba(255,255,255,0.24)]'
              }`}
            >
              Open Billing Suite
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ai-workspace')}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-full border-0 px-6 text-[14px] font-bold transition ${
                isLight
                  ? 'bg-zinc-100 text-black hover:bg-zinc-200'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              <Play className="h-4 w-4 text-current" />
              AI Workspace
            </button>
          </motion.div>
        </div>
      </section>

      <section className="grid gap-4 py-6 md:grid-cols-3">
        {businessThoughts.map((thought, index) => {
          const Icon = thought.icon;

          return (
            <motion.article
              key={thought.title}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.34, delay: index * 0.07, ease: 'easeOut' }}
              className={`relative min-h-[210px] overflow-hidden rounded-xl border-0 p-5 transition-all ${
                isLight
                  ? 'bg-zinc-50 text-black shadow-sm'
                  : 'bg-black text-white'
              }`}
            >
              <div className="relative">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full border-0 ${
                  isLight
                    ? 'bg-zinc-100 text-black'
                    : 'bg-zinc-900 text-white'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className={`mt-8 text-[20px] font-bold ${isLight ? '!text-black' : '!text-white'}`} style={{ color: isLight ? '#000000' : '#ffffff' }}>{thought.title}</h3>
                <p className={`mt-3 text-[14.5px] leading-7 ${isLight ? 'text-zinc-600 font-medium' : 'text-zinc-400'}`}>{thought.description}</p>
              </div>
            </motion.article>
          );
        })}
      </section>

      <section className="grid gap-8 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <div className={`text-[12px] font-bold uppercase tracking-[0.2em] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>EasyTrader AI Suite</div>
          <h2 className={`mt-4 max-w-[11ch] text-[42px] font-extrabold leading-[1.02] tracking-tight md:text-[58px] ${
            isLight ? '!text-black' : '!text-white'
          }`} style={{ color: isLight ? '#000000' : '#ffffff' }}>
            What sets EasyTrader apart
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;

            return (
              <motion.article
                key={capability.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
                className={`relative min-h-[260px] overflow-hidden rounded-xl border-0 p-5 transition-all ${
                  isLight
                    ? 'bg-zinc-50 text-black shadow-sm'
                    : 'bg-black text-white'
                }`}
              >
                <div className="relative flex h-full flex-col justify-end">
                  <div className={`mb-auto flex h-11 w-11 items-center justify-center rounded-full border-0 ${
                    isLight
                      ? 'bg-zinc-100 text-black'
                      : 'bg-zinc-900 text-white'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className={`text-[20px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>{capability.title}</h3>
                  <p className={`mt-3 text-[14.5px] leading-7 ${isLight ? 'text-zinc-600 font-medium' : 'text-zinc-400'}`}>{capability.description}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
