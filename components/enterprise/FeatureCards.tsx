"use client"

import { motion } from 'framer-motion';
import { CheckCircle2, Lightbulb, Route } from 'lucide-react';

const features = [
  {
    icon: Lightbulb,
    title: 'Problem Identification',
    description: 'Surface operational bottlenecks from shop imagery, store activity, and business context.',
  },
  {
    icon: Route,
    title: 'Optimization Plans',
    description: 'Translate findings into inventory, staffing, and workflow decisions with measurable impact.',
  },
  {
    icon: CheckCircle2,
    title: 'Implementation Guide',
    description: 'Deliver the exact execution path, deployment steps, and systems needed to ship the fix.',
  },
];

export function FeatureCards() {
  return (
    <section className="grid gap-3 lg:grid-cols-3">
      {features.map((feature, index) => {
        const Icon = feature.icon;

        return (
          <motion.article
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.2, delay: index * 0.06, ease: 'easeOut' }}
            whileHover={{ y: -2, scale: 1.004, boxShadow: '0 0 0 1px #6366F1' }}
            className="border border-[#1A1A1A] bg-[#0A0A0A] p-6"
            style={{ borderRadius: 4 }}
          >
            <div className="mb-5 flex h-10 w-10 items-center justify-center border border-[#1A1A1A] bg-black text-white">
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-white">{feature.title}</h3>
            <p className="mt-3 max-w-[30ch] text-[15px] leading-6 text-[#D1D5DB]">{feature.description}</p>
          </motion.article>
        );
      })}
    </section>
  );
}