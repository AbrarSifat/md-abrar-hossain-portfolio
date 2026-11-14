'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowUpRight, Eye, Check } from 'lucide-react';
import {
  VERIFIED_CREDENTIALS,
  EDUCATION_RECORDS,
  SKILL_CLUSTERS,
  type VerifiedCredential,
} from '@/data/portfolio';
import { sounds } from '@/lib/sound';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MacGeniePreview, type MacGeniePointerTarget } from './MacGeniePreview';
import { DarkroomSpotlightGrid } from './DarkroomSpotlightGrid';
import {
  CompetencyConstellation3D,
  SKILL_NODES,
  type SkillConstellationNode,
} from '@/components/three/CompetencyConstellation3D';
import { WebGLErrorBoundary } from '@/components/WebGLErrorBoundary';

const VerifiedCertificationsBlock: React.FC = () => {
  const [hoveredCred, setHoveredCred] = useState<VerifiedCredential | null>(null);
  const [selectedCred, setSelectedCred] = useState<VerifiedCredential | null>(null);
  const pointerTargetRef = useRef<MacGeniePointerTarget | null>(null);
  const hoveredRowCenterYRef = useRef<number>(0);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:gap-8 border-t border-alabaster/[0.09] py-8 sm:py-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
            Verified Certifications
          </h3>
          <p className="mt-2 max-w-xs text-xs font-light leading-relaxed text-ink-subtle">
            Select any credential to inspect verification on Coursera or LinkedIn.
          </p>
        </div>

        <div
          onMouseLeave={() => {
            setHoveredCred(null);
            pointerTargetRef.current = null;
          }}
          className="group/creds divide-y divide-alabaster/[0.09] border-y border-alabaster/[0.09] lg:col-span-8 relative"
        >
          {VERIFIED_CREDENTIALS.map((cred) => (
            <div
              key={cred.id}
              onClick={() => {
                sounds.playLensMount();
                setHoveredCred(null);
                pointerTargetRef.current = null;
                setSelectedCred(cred);
              }}
              onMouseEnter={(e) => {
                if (!window.matchMedia('(hover: hover)').matches) return;
                sounds.playPrismSnap();
                const rect = e.currentTarget.getBoundingClientRect();
                const rowY = (rect.top + rect.bottom) / 2;
                hoveredRowCenterYRef.current = rowY;
                pointerTargetRef.current = { x: e.clientX, y: e.clientY, rowY };
                setHoveredCred(cred);
              }}
              onMouseMove={(e) => {
                if (!window.matchMedia('(hover: hover)').matches) return;
                pointerTargetRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  rowY: hoveredRowCenterYRef.current,
                };
              }}
              className="group flex flex-col justify-between gap-4 py-6 sm:py-7 transition-opacity duration-200 ease-out will-change-[opacity] [@media(hover:hover)]:group-hover/creds:opacity-40 [@media(hover:hover)]:hover:!opacity-100 sm:flex-row sm:items-center relative cursor-pointer"
            >
              <div className="flex-1 pr-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-sand sm:text-ink-subtle">
                  {cred.issuer}
                </p>
                <h4 className="mt-1 text-lg sm:text-xl font-light tracking-[-0.02em] text-alabaster transition-transform duration-200 ease-out will-change-transform [@media(hover:hover)]:group-hover:translate-x-1.5">
                  {cred.title}
                </h4>
                <p className="mt-1 text-xs font-light text-ink-subtle line-clamp-2 sm:line-clamp-none">
                  {cred.skills}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 font-mono text-xs text-ink-muted shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-alabaster/[0.06]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playLensMount();
                    setSelectedCred(cred);
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-sand/35 bg-sand/10 px-3 py-1 text-[11px] text-sand hover:border-sand hover:bg-sand/20 transition-colors duration-150"
                >
                  <Eye className="h-3 w-3" />
                  <span>Inspect</span>
                </button>

                <div className="text-left sm:text-right">
                  <span className="block text-sand-light">{cred.credentialId}</span>
                  <span className="text-[11px] text-ink-subtle">{cred.date}</span>
                </div>

                <a
                  href={cred.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="VERIFY"
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playLeicaShutter();
                  }}
                  className="p-1 hover:text-alabaster focus:outline-none"
                  aria-label={`Verify ${cred.title} on ${cred.issuer}`}
                  title="Verify on official issuer"
                >
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-alabaster" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Authentic macOS Genie Effect (Ref-driven pointer tracking — zero mousemove re-renders) */}
      <MacGeniePreview
        imageSrc={hoveredCred ? hoveredCred.image : null}
        pointerRef={pointerTargetRef}
      />

      {/* Complete Certificate Pop-up Inspection Modal (Mobile & Desktop) */}
      <Dialog
        open={!!selectedCred}
        onOpenChange={(open) => {
          if (!open) {
            sounds.playLensUnmount();
            setSelectedCred(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl bg-void/96 border-alabaster/[0.14] p-5 sm:p-7 shadow-2xl backdrop-blur-md">
          {selectedCred && (
            <div className="space-y-5">
              {/* Header */}
              <div className="pr-10">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-sand font-medium">
                  {selectedCred.issuer} · Verified Credential
                </span>
                <DialogTitle className="mt-1.5 text-xl sm:text-2xl font-light tracking-[-0.02em] text-alabaster">
                  {selectedCred.title}
                </DialogTitle>
                <DialogDescription className="mt-1 font-mono text-xs text-ink-subtle">
                  ID: <span className="text-sand-light">{selectedCred.credentialId}</span> · Issued {selectedCred.date}
                </DialogDescription>
              </div>

              {/* High-Resolution Certificate Visual */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-alabaster/[0.1] bg-black/60 shadow-inner">
                <Image
                  src={selectedCred.image}
                  alt={selectedCred.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority
                />
              </div>

              {/* Verified Competencies */}
              <div className="rounded-md border border-alabaster/[0.08] bg-alabaster/[0.02] p-3 text-xs font-light text-ink-muted">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-subtle block mb-1">
                  Validated Competencies
                </span>
                {selectedCred.skills}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-alabaster/[0.08]">
                <a
                  href={selectedCred.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sounds.playLeicaShutter()}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-sand px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-obsidian transition-opacity hover:opacity-90"
                >
                  <span>Verify on Official Issuer</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playLensUnmount();
                    setSelectedCred(null);
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-alabaster/[0.14] px-4 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-ink-secondary hover:text-alabaster hover:border-alabaster/40"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export const CredentialsSection: React.FC = () => {
  const [stackViewMode, setStackViewMode] = useState<'grid' | 'list'>('grid');
  const [skillViewMode, setSkillViewMode] = useState<'constellation' | 'ledger'>('constellation');
  const [selectedSkillNode, setSelectedSkillNode] = useState<SkillConstellationNode>(SKILL_NODES[0]);
  const [skillCategoryFilter, setSkillCategoryFilter] = useState<'all' | 'commercial' | 'delivery' | 'strategy'>('all');

  return (
    <section
      id="credentials"
      className="mx-auto max-w-[1360px] border-t border-alabaster/[0.08] px-4 sm:px-6 py-14 sm:py-28 lg:py-36 lg:px-12"
    >
      {/* Header */}
      <div className="grid grid-cols-1 gap-5 sm:gap-8 pb-8 sm:pb-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
            05 — Credentials &amp; Capabilities
          </span>
        </div>
        <div className="lg:col-span-8">
          <h2 className="text-3xl font-light tracking-[-0.03em] text-alabaster sm:text-5xl">
            Verified pedigree &amp;{' '}
            <span className="font-serif italic font-normal text-sand-light">
              operational arsenal.
            </span>
          </h2>
        </div>
      </div>

      {/* Cryptographically Verifiable Certificates */}
      <VerifiedCertificationsBlock />

      {/* Academic Foundation */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8 border-t border-alabaster/[0.09] py-8 sm:py-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
            Academic Pedigree
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:gap-10 md:grid-cols-3 lg:col-span-8">
          {EDUCATION_RECORDS.map((edu, idx) => (
            <motion.div
              key={edu.degree}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: idx * 0.06 }}
              className="space-y-3"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-sand">
                {edu.score}
              </span>
              <h4 className="text-base font-normal leading-snug text-alabaster">
                {edu.degree}
              </h4>
              <p className="font-mono text-[11px] text-ink-muted">{edu.institution}</p>
              <p className="text-xs font-light leading-relaxed text-ink-subtle">
                {edu.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 05.A — Commercial & Delivery Governance (3D Synaptic Constellation & Proof Graph) */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8 border-t border-alabaster/[0.09] pt-10 sm:pt-14 lg:grid-cols-12">
        <div
          className={`lg:col-span-4 ${
            skillViewMode === 'constellation' ? 'lg:pt-20' : ''
          }`}
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-sand">
            05.A — Leadership &amp; Governance
          </span>
          <h3 className="mt-2 text-xl font-light text-alabaster">
            Commercial &amp; Delivery Governance
          </h3>
          <p className="mt-2 text-xs font-light text-ink-subtle max-w-xs leading-relaxed">
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
                      <h4 className="mt-1 text-sm font-normal leading-snug text-alabaster">
                        {selectedSkillNode.label}
                      </h4>
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

      {/* 05.B — Technical & Operations Stack (Spacious Landscape Presentation) */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8 border-t border-alabaster/[0.09] pt-10 mt-10 sm:pt-14 sm:mt-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-sand">
            05.B — Operational Arsenal
          </span>
          <h3 className="mt-2 text-xl font-light text-alabaster">
            Technical &amp; Operations Stack
          </h3>
          <p className="mt-2 text-xs font-light text-ink-subtle max-w-xs leading-relaxed">
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
