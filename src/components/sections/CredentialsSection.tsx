'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowUpRight, Eye } from 'lucide-react';
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
import { MacGeniePreview } from './MacGeniePreview';

export const CredentialsSection: React.FC = () => {
  const [hoveredCred, setHoveredCred] = useState<VerifiedCredential | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [rowCenterY, setRowCenterY] = useState<number | null>(null);
  const [selectedCred, setSelectedCred] = useState<VerifiedCredential | null>(null);

  return (
    <section
      id="credentials"
      className="mx-auto max-w-[1360px] border-t border-alabaster/[0.08] px-4 sm:px-6 py-20 sm:py-28 lg:py-36 lg:px-12"
    >
      {/* Header */}
      <div className="grid grid-cols-1 gap-8 pb-14 lg:grid-cols-12">
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
      <div className="grid grid-cols-1 gap-8 border-t border-alabaster/[0.09] py-12 lg:grid-cols-12">
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
            setCursorPos(null);
            setRowCenterY(null);
          }}
          className="group/creds divide-y divide-alabaster/[0.09] border-y border-alabaster/[0.09] lg:col-span-8 relative"
        >
          {VERIFIED_CREDENTIALS.map((cred) => (
            <div
              key={cred.id}
              onClick={() => {
                sounds.playLensMount();
                setSelectedCred(cred);
              }}
              onMouseEnter={(e) => {
                sounds.playPrismSnap();
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredCred(cred);
                setRowCenterY((rect.top + rect.bottom) / 2);
                setCursorPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => {
                setCursorPos({ x: e.clientX, y: e.clientY });
              }}
              className="group flex flex-col justify-between gap-4 py-6 sm:py-7 transition-opacity duration-500 group-hover/creds:opacity-35 hover:!opacity-100 sm:flex-row sm:items-center relative cursor-pointer"
            >
              <div className="flex-1 pr-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-sand sm:text-ink-subtle">
                  {cred.issuer}
                </p>
                <h4 className="mt-1 text-lg sm:text-xl font-light tracking-[-0.02em] text-alabaster transition-transform duration-500 group-hover:translate-x-2">
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
                  className="flex items-center gap-1.5 rounded-full border border-sand/35 bg-sand/10 px-3 py-1 text-[11px] text-sand hover:border-sand hover:bg-sand/20 transition-colors"
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
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-alabaster" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Authentic macOS Genie Effect (Anchored Within Content Line & Following Cursor for Desktop) */}
      <MacGeniePreview
        imageSrc={hoveredCred ? hoveredCred.image : null}
        cursorPos={cursorPos}
        rowCenterY={rowCenterY}
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
        <DialogContent className="max-w-2xl bg-void/98 border-alabaster/[0.14] p-5 sm:p-7 shadow-2xl backdrop-blur-2xl">
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

      {/* Academic Foundation */}
      <div className="grid grid-cols-1 gap-8 border-t border-alabaster/[0.09] py-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
            Academic Pedigree
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 lg:col-span-8">
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

      {/* Capabilities & Tooling Directory */}
      <div className="grid grid-cols-1 gap-8 border-t border-alabaster/[0.09] pt-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
            Capabilities &amp; Stack
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:col-span-8">
          <div>
            <h4 className="border-b border-alabaster/[0.09] pb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-alabaster">
              Commercial &amp; Delivery Governance
            </h4>
            <ul className="mt-4 grid grid-cols-1 gap-2.5">
              {SKILL_CLUSTERS.leadership.map((skill) => (
                <li
                  key={skill}
                  onMouseEnter={() => sounds.playScrollTick(0.15)}
                  className="text-xs font-light text-ink-muted transition-colors hover:text-alabaster"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="border-b border-alabaster/[0.09] pb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-alabaster">
              Technical &amp; Operations Stack
            </h4>
            <ul className="mt-4 grid grid-cols-1 gap-2.5 font-mono">
              {SKILL_CLUSTERS.techStack.map((tool) => (
                <li
                  key={tool}
                  onMouseEnter={() => sounds.playScrollTick(0.15)}
                  className="text-xs font-normal text-ink-muted transition-colors hover:text-alabaster"
                >
                  {tool}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
