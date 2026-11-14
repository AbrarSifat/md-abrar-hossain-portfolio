'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CAREER_TIMELINE, type PersonaType } from '@/data/portfolio';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { sounds } from '@/lib/sound';

export const TrajectorySection: React.FC = () => {
  const [lens, setLens] = useState<PersonaType>('all');

  const milestones = CAREER_TIMELINE.filter(
    (m) => lens === 'all' || m.persona === 'both' || m.persona === lens
  );

  return (
    <section
      id="trajectory"
      className="mx-auto max-w-[1360px] border-t border-alabaster/[0.08] px-4 sm:px-6 py-14 sm:py-28 lg:py-36 lg:px-12"
    >
      <div className="flex flex-col justify-between gap-6 sm:gap-8 pb-8 sm:pb-14 lg:flex-row lg:items-end">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
            04 — Experience
          </span>
          <h2 className="mt-4 text-3xl font-light tracking-[-0.03em] text-alabaster sm:text-5xl">
            Career{' '}
            <span className="font-serif italic font-normal text-sand-light">
              trajectory.
            </span>
          </h2>
        </div>

        <Tabs
          value={lens}
          onValueChange={(v) => {
            sounds.playApertureClick();
            setLens(v as PersonaType);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">Complete</TabsTrigger>
            <TabsTrigger value="brm">Commercial &amp; BRM</TabsTrigger>
            <TabsTrigger value="pm">PM &amp; Delivery</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Swiss Architectural Ledger */}
      <div className="divide-y divide-alabaster/[0.09] border-y border-alabaster/[0.09]">
        {milestones.map((item, idx) => (
          <motion.article
            key={item.id}
            onMouseEnter={() => sounds.playScrollTick(0.2)}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: idx * 0.05 }}
            className="grid grid-cols-1 gap-4 sm:gap-6 py-8 sm:py-11 lg:grid-cols-12 lg:gap-10"
          >
            {/* Period & Location */}
            <div className="lg:col-span-3">
              <p className="font-mono text-xs text-alabaster">{item.period}</p>
              <p className="mt-1 font-mono text-[11px] text-ink-subtle">{item.location}</p>
            </div>

            {/* Role & Organization */}
            <div className="lg:col-span-4">
              <h3 className="text-xl font-normal tracking-[-0.02em] text-alabaster sm:text-2xl">
                {item.role}
              </h3>
              <p className="mt-1 font-serif text-lg italic text-sand-light">
                {item.company}
              </p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                {item.highlightMetric}
              </p>
            </div>

            {/* Executive Summary & Outcomes */}
            <div className="space-y-4 lg:col-span-5">
              <p className="text-sm font-light leading-relaxed text-ink-secondary">
                {item.summary}
              </p>
              <ul className="space-y-2 border-t border-alabaster/[0.07] pt-4">
                {item.achievements.map((ach) => (
                  <li key={ach} className="flex items-baseline gap-3 text-xs font-light leading-relaxed text-ink-muted">
                    <span className="text-ink-faint">—</span>
                    <span>{ach}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};
