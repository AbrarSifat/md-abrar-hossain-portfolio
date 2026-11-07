'use client';

import React, { useMemo, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { AI_BRIEF_PROMPTS } from '@/data/portfolio';
import { sounds } from '@/lib/sound';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface AiBriefModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AiBriefModal: React.FC<AiBriefModalProps> = ({ open, onOpenChange }) => {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      sounds.playLensMount();
    } else {
      sounds.playLensUnmount();
    }
    onOpenChange(nextOpen);
  };

  const customAnswer = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    if (q.includes('contact') || q.includes('email') || q.includes('phone') || q.includes('whatsapp') || q.includes('hire')) {
      return 'Reach Md. Abrar Hossain directly at abrarsifat47@gmail.com, via WhatsApp / Phone at +880 1627218950, or on LinkedIn (linkedin.com/in/abrarsifat47/). Available for global Business Relationship Manager, Technical PM, and Operations Leadership mandates.';
    }
    if (q.includes('uk') || q.includes('london') || q.includes('hospitality') || q.includes('automation') || q.includes('compileq')) {
      return 'At CompileQ & Qamla Ltd (129 Mile End Rd, London E1), Abrar architected commercial quoting, DNS/Hostinger infrastructure, and Automation360° EPOS/KDS deployments across Chelsea, Soho, Leicester Square, and Westminster (La Mia Mamma, Limoncello, Little Italy, Little Sicily)—driving +50% client satisfaction & retention.';
    }
    if (q.includes('education') || q.includes('degree') || q.includes('university') || q.includes('uftb') || q.includes('cgpa')) {
      return 'Abrar holds a B.Engg. in Educational Technology and Engineering from University of Frontier Technology Bangladesh (UFTB, formerly BSMRDU) with a 3.40 CGPA, preceded by a 5.00 GPA in HSC Science from Chittagong College.';
    }
    if (q.includes('python') || q.includes('tech') || q.includes('tool') || q.includes('jira') || q.includes('clickup') || q.includes('stack')) {
      return 'Daily stack: Agentic AI Systems, Frontier LLMs (Gemini, Claude, Antigravity, Kimi), Jira, ClickUp, Hostinger Ecosystem, WordPress, VS Code & Windsurf, Python (Pandas & Plotly), Digital Forensic Tools, Canva, Google Workspace, and Microsoft Suite.';
    }
    if (q.includes('cert') || q.includes('coursera') || q.includes('uc davis') || q.includes('vanderbilt') || q.includes('wadhwani')) {
      return 'Verified credentials: UC Davis ("Cross-Cultural Communication and Management", ID: HY13BEC60ZDW), Vanderbilt University ("Agentic AI and AI Agents: A Primer for Leaders", ID: F0EO14IJZH2P), University of London ("Professional Skills for International Business", ID: 9BNL06SKI0UC), and Wadhwani Foundation ("Employability and Soft Skill Certification — Ready to Rise!", Oct 2023).';
    }
    return 'Md. Abrar Hossain pairs B.Engg. technical fluency with UK B2B commercial leadership at CompileQ (+50% client retention, +50% delivery efficiency, +25% HR retention). Select a prompt below or query UK accounts, stack, education, or contact.';
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <div className="space-y-6">
          <div className="border-b border-alabaster/[0.09] pb-5 pr-10">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-subtle">
              Executive Brief · ⌘K
            </span>
            <DialogTitle className="mt-2">Interactive Dossier Query</DialogTitle>
            <DialogDescription className="mt-1 font-light">
              Synthesized responses across UK commercial strategy, agile delivery, and academic pedigree.
            </DialogDescription>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query UK accounts, Jira/Python stack, UFTB degree, or contact..."
              className="w-full border border-alabaster/[0.14] bg-transparent py-3 pl-10 pr-4 text-sm font-light text-alabaster placeholder:text-ink-faint focus:border-alabaster/50 focus:outline-none"
            />
          </div>

          <div className="border-l border-sand/60 pl-5 py-1">
            <p className="text-sm font-light leading-relaxed text-ink-secondary">
              {customAnswer ?? AI_BRIEF_PROMPTS[selectedIdx].a}
            </p>
          </div>

          <div className="divide-y divide-alabaster/[0.08] border-y border-alabaster/[0.08]">
            {AI_BRIEF_PROMPTS.map((item, idx) => {
              const isSelected = !customAnswer && selectedIdx === idx;
              return (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => {
                    sounds.playApertureClick();
                    setQuery('');
                    setSelectedIdx(idx);
                  }}
                  className={`flex w-full items-center justify-between gap-4 py-3.5 text-left text-xs font-light transition-colors ${
                    isSelected ? 'text-alabaster font-normal' : 'text-ink-subtle hover:text-ink-secondary'
                  }`}
                >
                  <span>{item.q}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
