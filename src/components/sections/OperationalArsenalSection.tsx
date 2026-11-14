'use client';

import React, { useState } from 'react';
import { SKILL_CLUSTERS } from '@/data/portfolio';
import { sounds } from '@/lib/sound';
import { DarkroomSpotlightGrid } from './DarkroomSpotlightGrid';

/** Standalone 06 — Operational Arsenal section showcasing the interactive tech & operations stack. */
export const OperationalArsenalSection: React.FC = () => {
  const [stackViewMode, setStackViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <section
      id="arsenal"
      className="mx-auto max-w-[1360px] border-t border-alabaster/[0.08] px-4 sm:px-6 py-14 sm:py-28 lg:py-36 lg:px-12"
    >
      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
            06 — Operational Arsenal
          </span>
          <h2 className="mt-4 text-3xl font-light tracking-[-0.03em] text-alabaster sm:text-4xl">
            Technical &amp;{' '}
            <span className="font-serif italic font-normal text-sand-light">
              operations stack.
            </span>
          </h2>
          <p className="mt-4 text-sm font-light leading-relaxed text-ink-muted max-w-xs">
            Curated operational command center with real-world production telemetry across 12 core platforms.
          </p>

          <div className="mt-6 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em]">
            <span className="text-ink-subtle mr-2">Layout:</span>
            <button
              type="button"
              onClick={() => {
                sounds.playApertureClick();
                setStackViewMode('grid');
              }}
              className={`rounded px-2.5 py-1 transition-all ${
                stackViewMode === 'grid'
                  ? 'bg-sand text-obsidian font-semibold'
                  : 'text-ink-subtle hover:text-alabaster'
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playApertureClick();
                setStackViewMode('list');
              }}
              className={`rounded px-2.5 py-1 transition-all ${
                stackViewMode === 'list'
                  ? 'bg-sand text-obsidian font-semibold'
                  : 'text-ink-subtle hover:text-alabaster'
              }`}
            >
              List
            </button>
          </div>
        </div>

        <div className="lg:col-span-8">
          {stackViewMode === 'grid' ? (
            <DarkroomSpotlightGrid />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 font-mono">
              {SKILL_CLUSTERS.techStack.map((tool, idx) => (
                <div
                  key={tool}
                  onMouseEnter={() => {
                    if (window.matchMedia('(hover: hover)').matches) sounds.playScrollTick(0.15);
                  }}
                  className="flex items-center gap-2 sm:gap-2.5 rounded-lg border border-alabaster/[0.08] bg-obsidian/40 px-3 py-2.5 sm:px-3.5 sm:py-3 transition-colors hover:border-sand/40 hover:bg-alabaster/[0.03]"
                >
                  <span className="text-[9.5px] sm:text-[10px] text-sand/60 shrink-0">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="text-[11px] sm:text-xs font-normal text-ink-secondary hover:text-alabaster transition-colors leading-tight">
                    {tool}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
