"use client"

import { motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, Lightbulb, Orbit, Play, ShieldCheck, Target, Zap } from 'lucide-react';
import type { DashboardData, TabKey } from './types';
import { CosmicScene } from './CosmicScene';

interface HeroSectionProps {
  data: DashboardData;
  onNavigate: (tab: TabKey) => void;
}

export function HeroSection({ data, onNavigate }: HeroSectionProps) {
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
      <section className="relative left-1/2 min-h-[calc(100vh-5.25rem)] w-screen -translate-x-1/2 overflow-hidden border-b border-border">
        <CosmicScene />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5.25rem)] w-full max-w-[1180px] flex-col items-center justify-center px-4 pb-40 pt-24 text-center md:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 22, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.65, delay: 0.08, ease: 'easeOut' }}
            className="max-w-[12ch] text-[54px] font-semibold leading-[0.98] tracking-normal text-foreground sm:text-[72px] lg:text-[92px]"
          >
            Everything Your Business Needs. One Platform.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.2, ease: 'easeOut' }}
            className="mt-6 max-w-2xl text-[17px] leading-8 text-foreground/72 md:text-[19px]"
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
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-primary bg-primary px-6 text-[14px] font-semibold text-primary-foreground shadow-sm transition hover:scale-[1.02]"
            >
              Open Billing
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ai-workspace')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-background/30 px-6 text-[14px] font-semibold text-foreground shadow-sm backdrop-blur-xl transition hover:border-border/30 hover:bg-background/10"
            >
              <Play className="h-4 w-4" />
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
              whileHover={{ y: -4, borderColor: 'hsl(var(--border))' }}
              className="relative min-h-[210px] overflow-hidden rounded-[8px] border border-border bg-card p-5 shadow-sm"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(255,156,42,0.16),transparent_32%),radial-gradient(circle_at_84%_20%,rgba(59,168,255,0.14),transparent_34%)]" />
              <motion.div
                aria-hidden
                className="absolute -right-12 -top-12 h-32 w-32 rounded-full border border-border"
                animate={{ rotate: 360 }}
                transition={{ duration: 18 + index * 4, repeat: Infinity, ease: 'linear' }}
              />
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/80 text-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-8 text-[22px] font-semibold text-foreground">{thought.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-foreground/62">{thought.description}</p>
              </div>
            </motion.article>
          );
        })}
      </section>

      <section className="grid gap-8 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-primary">EasyTrader AI Suite</div>
          <h2 className="mt-4 max-w-[11ch] text-[42px] font-semibold leading-[1.02] tracking-normal text-foreground md:text-[58px]">
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
                className="relative min-h-[260px] overflow-hidden rounded-[8px] border border-border bg-card p-5 shadow-sm"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,138,31,0.16),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(74,163,255,0.18),transparent_30%),linear-gradient(180deg,transparent,rgba(255,255,255,0.05))]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/35 to-transparent" />
                <div className="relative flex h-full flex-col justify-end">
                  <div className="mb-auto flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/80 text-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-foreground">{capability.title}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-foreground/62">{capability.description}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
