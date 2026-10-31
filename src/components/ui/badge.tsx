import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
  {
    variants: {
      variant: {
        default: 'border-champagne/30 bg-champagne/10 text-champagne-light',
        secondary: 'border-white/10 bg-white/[0.04] text-zinc-300',
        electric: 'border-electric/35 bg-electric/10 text-indigo-300',
        emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
