'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { sounds } from '@/lib/sound';
import {
  CASE_STUDIES,
  CORRIDOR_ACCOUNTS,
  type CaseStudy,
  type PersonaType,
} from '@/data/portfolio';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export const WorkSection: React.FC = () => {
  const [persona, setPersona] = useState<PersonaType>('all');
  const [activeStudy, setActiveStudy] = useState<CaseStudy | null>(null);
  const [hoveredStudy, setHoveredStudy] = useState<CaseStudy | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const filteredStudies = CASE_STUDIES.filter(
    (s) => persona === 'all' || s.persona === 'both' || s.persona === persona
  );

  return (
    <>
      {/* 02 — Selected Works */}
      <section
        id="work"
        className="mx-auto max-w-[1360px] border-t border-alabaster/[0.08] px-4 sm:px-6 py-20 sm:py-28 lg:py-36 lg:px-12"
      >
        <div className="flex flex-col justify-between gap-8 pb-14 lg:flex-row lg:items-end">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
              02 — Selected Works
            </span>
            <h2 className="mt-4 text-3xl font-light tracking-[-0.03em] text-alabaster sm:text-5xl">
              Case{' '}
              <span className="font-serif italic font-normal text-sand-light">
                dossiers.
              </span>
            </h2>
          </div>

          <Tabs
            value={persona}
            onValueChange={(v) => {
              sounds.playApertureClick();
              setPersona(v as PersonaType);
            }}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="brm">Commercial &amp; BRM</TabsTrigger>
              <TabsTrigger value="pm">PM &amp; Systems</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Sibling-Dimming Minimalist Editorial Index */}
        <div
          onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
          onMouseLeave={() => setHoveredStudy(null)}
          className="group/list divide-y divide-alabaster/[0.09] border-y border-alabaster/[0.09]"
        >
          {filteredStudies.map((study) => (
            <motion.button
              key={study.id}
              type="button"
              data-cursor="VIEW"
              onMouseEnter={() => {
                sounds.playScrollTick();
                setHoveredStudy(study);
              }}
              onClick={() => {
                sounds.playLensMount();
                setActiveStudy(study);
              }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55 }}
              className="group grid w-full grid-cols-1 items-baseline gap-4 py-9 text-left transition-opacity duration-500 group-hover/list:opacity-35 hover:!opacity-100 md:grid-cols-12 md:gap-6 md:py-11 focus:outline-none"
            >
              <span className="font-mono text-xs text-ink-subtle md:col-span-1">
                {study.index}
              </span>

              <div className="md:col-span-6">
                <h3 className="text-2xl font-light tracking-[-0.025em] text-alabaster transition-transform duration-500 ease-out group-hover:translate-x-2.5 sm:text-3xl">
                  {study.title}
                </h3>
                <p className="mt-1.5 text-xs font-light text-ink-subtle">
                  {study.subtitle}
                </p>
              </div>

              <div className="font-mono text-[11px] text-ink-subtle md:col-span-3">
                <span className="block text-ink-secondary">{study.client}</span>
                <span>{study.year}</span>
              </div>

              <div className="flex items-center justify-between md:col-span-2 md:justify-end md:gap-4">
                <div className="text-left md:text-right">
                  <span className="block text-xl font-light tracking-tight text-sand-light sm:text-2xl">
                    {study.headlineMetric}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-subtle">
                    {study.headlineMetricLabel}
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-alabaster" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Floating Cursor Hover Portal (One Page Love Signature Interaction) */}
        <AnimatePresence>
          {hoveredStudy && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: mousePos.x + 28,
                y: mousePos.y - 70,
              }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{
                type: 'spring',
                stiffness: 450,
                damping: 32,
                mass: 0.5,
              }}
              className="pointer-events-none fixed z-50 hidden w-64 rounded-xl border border-alabaster/[0.14] bg-obsidian-subtle/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl md:block"
              style={{
                boxShadow: `0 20px 40px -15px ${hoveredStudy.accentColor}30`,
              }}
            >
              <div className="flex items-center justify-between border-b border-alabaster/[0.08] pb-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-subtle">
                  Dossier {hoveredStudy.index}
                </span>
                <span
                  className="font-mono text-[9px] uppercase tracking-[0.14em]"
                  style={{ color: hoveredStudy.accentColor }}
                >
                  {hoveredStudy.location}
                </span>
              </div>

              <div className="mt-3">
                <span className="block text-2xl font-light tracking-tight text-alabaster">
                  {hoveredStudy.headlineMetric}
                </span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                  {hoveredStudy.headlineMetricLabel}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {hoveredStudy.stack.slice(0, 3).map((tool) => (
                  <span
                    key={tool}
                    className="rounded border border-alabaster/[0.08] bg-alabaster/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-ink-subtle"
                  >
                    {tool}
                  </span>
                ))}
              </div>

              <div className="mt-3.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-sand-light">
                <span>Click to inspect dossier</span>
                <ArrowUpRight className="h-2.5 w-2.5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Semantic Pre-Rendered Case Dossier Text for Search & AI Crawlers (Zero Visual Change) */}
        <div className="sr-only">
          {CASE_STUDIES.map((study) => (
            <article key={study.id}>
              <h3>{study.title} — {study.client} ({study.location}, {study.year})</h3>
              <p>{study.challenge}</p>
              <p>{study.strategy}</p>
              <ul>
                {study.outcomes.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Minimalist Architectural Case Dossier Modal */}
        <Dialog
          open={!!activeStudy}
          onOpenChange={(open) => {
            if (!open) {
              sounds.playLensUnmount();
              setActiveStudy(null);
            }
          }}
        >
          {activeStudy && (
            <DialogContent>
              <div className="space-y-8">
                <div className="border-b border-alabaster/[0.09] pb-6 pr-10">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-subtle">
                    <span>Dossier {activeStudy.index}</span>
                    <span>/</span>
                    <span>{activeStudy.location}</span>
                    <span>/</span>
                    <span>{activeStudy.year}</span>
                  </div>
                  <DialogTitle className="mt-3">{activeStudy.title}</DialogTitle>
                  <DialogDescription className="mt-2 font-light text-ink-muted">
                    {activeStudy.subtitle}
                  </DialogDescription>
                </div>

                {/* Hairline Metrics Strip */}
                <div className="grid grid-cols-2 gap-6 border-b border-alabaster/[0.09] pb-8 sm:grid-cols-4">
                  <div>
                    <div className="text-2xl font-light tracking-tight text-sand-light">
                      {activeStudy.headlineMetric}
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-subtle">
                      {activeStudy.headlineMetricLabel}
                    </div>
                  </div>
                  {activeStudy.secondaryMetrics.map((m) => (
                    <div key={m.label}>
                      <div className="text-2xl font-light tracking-tight text-alabaster">
                        {m.value}
                      </div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-subtle">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Two-Column Context & Strategy */}
                <div className="grid grid-cols-1 gap-8 border-b border-alabaster/[0.09] pb-8 sm:grid-cols-2">
                  <div>
                    <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-subtle">
                      Context &amp; Challenge
                    </h4>
                    <p className="mt-3 text-sm font-light leading-relaxed text-ink-secondary">
                      {activeStudy.challenge}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-subtle">
                      Strategic Architecture
                    </h4>
                    <p className="mt-3 text-sm font-light leading-relaxed text-ink-secondary">
                      {activeStudy.strategy}
                    </p>
                  </div>
                </div>

                {/* Execution Sequence & Audited Outcomes */}
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-subtle">
                        Execution Pipeline
                      </h4>
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-sand-light">
                        0{activeStudy.architectureFlow.length} Sequential Phases
                      </span>
                    </div>
                    <ol className="mt-3 space-y-2">
                      {activeStudy.architectureFlow.map((step, idx) => (
                        <li
                          key={step}
                          onMouseEnter={() => sounds.playTick()}
                          className="group/step relative flex items-start gap-3 rounded-lg border border-alabaster/[0.07] bg-alabaster/[0.02] p-2.5 transition-all duration-300 hover:border-sand/40 hover:bg-sand/[0.05] hover:shadow-[0_0_20px_rgba(200,184,154,0.12)] active:border-sand/50 active:bg-sand/[0.08]"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] bg-alabaster/[0.08] text-ink-subtle transition-colors duration-300 group-hover/step:bg-sand-light group-hover/step:text-obsidian group-hover/step:font-semibold">
                            0{idx + 1}
                          </span>
                          <span className="text-xs font-light leading-relaxed text-ink-secondary transition-colors duration-300 group-hover/step:text-alabaster group-hover/step:font-normal">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-subtle">
                      Audited Outcomes
                    </h4>
                    <ul className="mt-3 space-y-2.5">
                      {activeStudy.outcomes.map((out) => (
                        <li key={out} className="flex items-baseline gap-3 text-xs font-light text-ink-secondary">
                          <span className="text-sand">—</span>
                          <span>{out}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Minimal Stack Footer */}
                <div className="border-t border-alabaster/[0.09] pt-5 font-mono text-[11px] text-ink-subtle">
                  {activeStudy.stack.join('  ·  ')}
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </section>

      {/* 03 — UK Corridor Footprint */}
      <section
        id="corridor"
        className="mx-auto max-w-[1360px] border-t border-alabaster/[0.08] px-4 sm:px-6 py-20 sm:py-28 lg:py-36 lg:px-12"
      >
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
              03 — London Corridor
            </span>
            <h2 className="mt-4 text-3xl font-light tracking-[-0.03em] text-alabaster sm:text-4xl">
              UK hospitality &amp;{' '}
              <span className="font-serif italic font-normal text-sand-light">
                SaaS accounts.
              </span>
            </h2>
            <p className="mt-4 text-sm font-light leading-relaxed text-ink-muted">
              Commercial scoping, Hostinger/DNS infrastructure, and Automation360° EPOS/KDS ecosystems across central London venues.
            </p>
          </div>

          <div className="lg:col-span-8">
            <Tabs
              defaultValue={CORRIDOR_ACCOUNTS[0].id}
              onValueChange={() => sounds.playApertureClick()}
            >
              <div className="overflow-x-auto">
                <TabsList className="w-max min-w-full">
                  {CORRIDOR_ACCOUNTS.map((acc) => (
                    <TabsTrigger key={acc.id} value={acc.id}>
                      {acc.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {CORRIDOR_ACCOUNTS.map((acc) => (
                <TabsContent
                  key={acc.id}
                  value={acc.id}
                  forceMount
                  className="data-[state=inactive]:hidden"
                >
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-6 border-b border-alabaster/[0.09] pb-8 sm:grid-cols-2">
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-subtle">
                          Location &amp; Sector
                        </span>
                        <p className="mt-2 text-sm font-normal text-alabaster">
                          {acc.location}
                        </p>
                        <p className="mt-0.5 text-xs font-light text-ink-subtle">
                          {acc.sector}
                        </p>
                      </div>

                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-subtle">
                          Execution &amp; Governance Model
                        </span>
                        <p className="mt-2 text-sm font-normal text-sand-light">
                          {acc.governanceModel}
                        </p>
                      </div>
                    </div>

                    <p className="max-w-2xl text-base font-light leading-relaxed text-ink-secondary">
                      {acc.summary}
                    </p>

                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-subtle">
                        Deployed Architecture
                      </span>
                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-ink-secondary">
                        {acc.ecosystem.map((tech) => (
                          <span key={tech} className="inline-flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-sand" />
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </section>
    </>
  );
};
