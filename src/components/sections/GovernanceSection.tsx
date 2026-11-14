'use client';

import React, { useState } from 'react';
import { sounds } from '@/lib/sound';
import {
  CompetencyConstellation3D,
  SKILL_NODES,
  type SkillConstellationNode,
} from '@/components/three/CompetencyConstellation3D';
import { WebGLErrorBoundary } from '@/components/WebGLErrorBoundary';

/** Standalone 03 — Commercial & Delivery Governance section featuring the interactive 3D constellation. */
export const GovernanceSection: React.FC = () => {
  const [skillViewMode, setSkillViewMode] = useState<'constellation' | 'ledger'>('constellation');
  const [selectedSkillNode, setSelectedSkillNode] = useState<SkillConstellationNode>(SKILL_NODES[0]);
  const [skillCategoryFilter, setSkillCategoryFilter] = useState<'all' | 'commercial' | 'delivery' | 'strategy'>('all');

  return (
    <section
      id="governance"
      className="mx-auto max-w-[1360px] px-4 sm:px-6 pt-4 pb-14 sm:pt-8 sm:pb-24 lg:pt-8 lg:pb-28 lg:px-12"
    >
      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-12">
        <div
          className={`lg:col-span-4 ${
            skillViewMode === 'constellation' ? 'lg:pt-14' : ''
          }`}
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
            03 — Leadership &amp; Governance
          </span>
          <h2 className="mt-4 text-3xl font-light tracking-[-0.03em] text-alabaster sm:text-4xl">
            Commercial &amp;{' '}
            <span className="font-serif italic font-normal text-sand-light">
              delivery governance.
            </span>
          </h2>
          <p className="mt-4 text-sm font-light leading-relaxed text-ink-muted max-w-xs">
            Connected 3D threaded synaptic constellation linking all {SKILL_NODES.length} leadership, commercial, and technical competencies to verified outcomes.
          </p>

          {/* Mode Switcher */}
          <div className="mt-6 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em]">
            <span className="text-ink-subtle mr-2">View:</span>
            <button
              type="button"
              onClick={() => {
                sounds.playApertureClick();
                setSkillViewMode('constellation');
              }}
              className={`rounded px-2.5 py-1 transition-all ${
                skillViewMode === 'constellation'
                  ? 'bg-sand text-obsidian font-semibold'
                  : 'text-ink-subtle hover:text-alabaster'
              }`}
            >
              3D Constellation
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playApertureClick();
                setSkillViewMode('ledger');
              }}
              className={`rounded px-2.5 py-1 transition-all ${
                skillViewMode === 'ledger'
                  ? 'bg-sand text-obsidian font-semibold'
                  : 'text-ink-subtle hover:text-alabaster'
              }`}
            >
              Matrix
            </button>
          </div>

          {/* Cluster Filter Buttons */}
          <div className="mt-4 flex flex-wrap gap-1.5 sm:gap-1 font-mono text-[9.5px] sm:text-[9px] uppercase tracking-[0.14em]">
            {(['all', 'commercial', 'delivery', 'strategy'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  sounds.playScrollTick(0.12);
                  setSkillCategoryFilter(cat);
                }}
                className={`rounded px-2.5 py-1 sm:px-2 sm:py-0.5 transition-colors ${
                  skillCategoryFilter === cat
                    ? 'border border-sand/40 bg-sand/15 text-sand font-medium'
                    : 'text-ink-subtle hover:text-alabaster'
                }`}
              >
                {cat === 'all' ? `All (${SKILL_NODES.length})` : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col">
          {skillViewMode === 'constellation' ? (
            <div key="view-constellation" className="flex flex-col w-full">
              <WebGLErrorBoundary>
                <CompetencyConstellation3D
                  selectedNode={selectedSkillNode}
                  onSelectNode={setSelectedSkillNode}
                  filterCategory={skillCategoryFilter}
                />
              </WebGLErrorBoundary>

              {/* Mobile Quick-Thread Rail & Active Competency Detail Card (Desktop >= md untouched) */}
              <div className="md:hidden mt-3 space-y-3">
                <div
                  className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1"
                  role="tablist"
                  aria-label="Competency node quick selector"
                >
                  {SKILL_NODES.filter(
                    (node) => skillCategoryFilter === 'all' || node.category === skillCategoryFilter
                  ).map((node) => {
                    const isSelected = node.id === selectedSkillNode.id;
                    const isNeighbor = selectedSkillNode.connectedIds.includes(node.id);

                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => {
                          sounds.playPrismSnap();
                          setSelectedSkillNode(node);
                        }}
                        className={`shrink-0 whitespace-nowrap rounded border px-2.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] transition-all ${
                          isSelected
                            ? 'border-sand bg-sand text-obsidian font-semibold shadow-[0_0_12px_rgba(200,184,154,0.28)]'
                            : isNeighbor
                            ? 'border-sand/40 bg-sand/10 text-sand-light'
                            : 'border-alabaster/[0.1] bg-obsidian/55 text-ink-subtle hover:text-alabaster'
                        }`}
                      >
                        {node.index} · {node.shortLabel}
                      </button>
                    );
                  })}
                </div>

                {/* Active Competency Thread Card */}
                <div className="rounded-lg border border-sand/30 bg-obsidian/65 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-sand">
                        Node {selectedSkillNode.index} · {selectedSkillNode.category}
                      </span>
                      <h3 className="mt-1 text-sm font-normal leading-snug text-alabaster">
                        {selectedSkillNode.label}
                      </h3>
                      <p className="mt-0.5 font-mono text-[9.5px] text-ink-subtle">
                        {selectedSkillNode.proofRole}
                      </p>
                    </div>
                  </div>

                  <p className="mt-2.5 text-[11px] font-light leading-relaxed text-ink-muted">
                    {selectedSkillNode.evidenceSummary}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-alabaster/[0.08] pt-2.5">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-sand-light">
                      {selectedSkillNode.auditedMetric}
                    </span>
                  </div>

                  {/* Interactive Connected Competency Thread Jumps */}
                  <div className="mt-2.5 border-t border-alabaster/[0.08] pt-2.5">
                    <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-ink-subtle mb-1.5">
                      Threaded Connections — Tap to Pivot
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSkillNode.connectedIds
                        .map((id) => SKILL_NODES.find((n) => n.id === id))
                        .filter((n): n is NonNullable<typeof n> => Boolean(n))
                        .map((neighbor) => (
                          <button
                            key={neighbor.id}
                            type="button"
                            onClick={() => {
                              sounds.playPrismSnap();
                              setSelectedSkillNode(neighbor);
                            }}
                            className="inline-flex items-center gap-1 rounded border border-alabaster/[0.12] bg-void/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-sand-light transition-colors active:border-sand active:bg-sand/15"
                          >
                            <span>{neighbor.index} · {neighbor.shortLabel}</span>
                            <span aria-hidden="true" className="text-sand">→</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <ul key="view-matrix" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
              {SKILL_NODES.map((node) => {
                const isSelected = node.id === selectedSkillNode.id;
                const matchesCategory =
                  skillCategoryFilter === 'all' || node.category === skillCategoryFilter;

                if (!matchesCategory) return null;

                return (
                  <li
                    key={node.id}
                    onClick={() => {
                      sounds.playPrismSnap();
                      setSelectedSkillNode(node);
                    }}
                    onMouseEnter={() => {
                      if (window.matchMedia('(hover: hover)').matches) sounds.playScrollTick(0.15);
                    }}
                    className={`group flex items-start gap-2.5 rounded-lg border px-3 py-2.5 sm:px-3.5 sm:py-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-sand bg-sand/15 shadow-[0_0_16px_rgba(200,184,154,0.15)]'
                        : 'border-alabaster/[0.08] bg-obsidian/40 hover:border-sand/40 hover:bg-alabaster/[0.03]'
                    }`}
                  >
                    <span
                      className={`font-mono text-[10px] shrink-0 mt-0.5 ${
                        isSelected ? 'text-sand font-bold' : 'text-sand/60'
                      }`}
                    >
                      {node.index}
                    </span>
                    <div>
                      <span
                        className={`text-xs font-light leading-relaxed block ${
                          isSelected ? 'text-alabaster font-medium' : 'text-ink-secondary group-hover:text-alabaster'
                        }`}
                      >
                        {node.label}
                      </span>
                      <span className="font-mono text-[9.5px] sm:text-[8px] uppercase tracking-[0.12em] sm:tracking-[0.14em] text-sand-light block mt-1">
                        {node.auditedMetric}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};
