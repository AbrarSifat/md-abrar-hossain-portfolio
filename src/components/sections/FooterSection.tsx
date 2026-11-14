'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check } from 'lucide-react';
import { sounds } from '@/lib/sound';

export const FooterSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const email = 'abrarsifat47@gmail.com';

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      sounds.playChime();
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <footer
      id="contact"
      className="border-t border-alabaster/[0.08] bg-void pt-16 pb-10 sm:pt-28 sm:pb-12 lg:pt-36 transition-colors duration-500"
    >
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
            06 — Contact
          </span>

          <h2 className="mt-5 max-w-3xl text-[clamp(2.25rem,5.5vw,5rem)] font-light leading-[1.05] tracking-[-0.035em] text-alabaster">
            Initiate a{' '}
            <span className="font-serif italic font-normal text-sand-light">
              conversation.
            </span>
          </h2>

          <p className="mt-6 max-w-lg text-sm font-light leading-relaxed text-ink-muted">
            Available for Business Relationship Management, Technical Project Leadership, and cross-border B2B engagements across the UK, Europe, and global remote teams.
          </p>

          {/* Monumental Understated Email Copy Trigger */}
          <div className="mt-8 sm:mt-12 max-w-full overflow-hidden">
            <button
              type="button"
              onClick={handleCopyEmail}
              data-cursor="COPY"
              className="group inline-flex flex-wrap items-baseline gap-2.5 sm:gap-4 border-b border-alabaster/[0.18] pb-3 text-left transition-colors hover:border-alabaster focus:outline-none max-w-full"
            >
              <span className="text-[19px] sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-alabaster break-all sm:break-normal">
                {email}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-ink-subtle transition-colors group-hover:text-sand-light">
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-sand" />
                    Copied to clipboard
                  </>
                ) : (
                  'Tap to copy'
                )}
              </span>
            </button>
          </div>

          {/* Direct Links */}
          <div className="mt-9 sm:mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 sm:gap-x-10 sm:gap-y-4 font-mono text-xs uppercase tracking-[0.16em] text-ink-muted">
            <a
              href="https://www.linkedin.com/in/abrarsifat47/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sounds.playApertureClick()}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-alabaster"
            >
              <span>LinkedIn</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>

            <a
              href="https://wa.me/8801627218950"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sounds.playApertureClick()}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-alabaster"
            >
              <span>WhatsApp (+880 1627218950)</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>

            <a
              href="/Md_Abrar_Hossain_Resume.pdf"
              download="Md_Abrar_Hossain_Resume.pdf"
              onClick={() => sounds.playLeicaShutter()}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-alabaster"
            >
              <span>Curriculum Vitae (PDF)</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </motion.div>

        {/* Minimal Colophon */}
        <div className="mt-14 sm:mt-24 flex flex-col justify-between gap-3 sm:gap-4 border-t border-alabaster/[0.08] pt-8 font-mono text-[11px] text-ink-faint sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Md. Abrar Hossain</span>
          <span>Chattogram, BD · London E1, UK</span>
        </div>
      </div>
    </footer>
  );
};
