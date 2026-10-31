'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full text-xs font-medium tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-alabaster/40 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-alabaster text-void hover:opacity-90',
        outline:
          'border border-alabaster/[0.16] bg-transparent text-alabaster hover:border-alabaster/50 hover:bg-alabaster/[0.04]',
        ghost:
          'text-ink-muted hover:text-alabaster',
        glass:
          'border border-alabaster/[0.12] bg-alabaster/[0.03] text-ink-secondary hover:border-alabaster/[0.26] hover:text-alabaster',
      },
      size: {
        default: 'h-11 px-6',
        sm: 'h-9 px-4 text-[11px]',
        lg: 'h-12 px-7 text-xs uppercase tracking-[0.14em]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
