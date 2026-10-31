import * as React from 'react';
import { cn } from '@/lib/utils';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string;
}

export const SpotlightCard = React.forwardRef<HTMLDivElement, SpotlightCardProps>(
  ({ className, children, spotlightColor = 'rgba(229, 199, 123, 0.14)', ...props }, ref) => {
    const divRef = React.useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = React.useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = React.useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!divRef.current) return;
      const rect = divRef.current.getBoundingClientRect();
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
      <div
        ref={(node) => {
          divRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setOpacity(1)}
        onMouseLeave={() => setOpacity(0)}
        className={cn(
          'group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-obsidian/80 backdrop-blur-xl transition-colors duration-500 hover:border-white/[0.18]',
          className
        )}
        {...props}
      >
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-500"
          style={{
            opacity,
            background: `radial-gradient(520px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 45%)`,
          }}
        />
        <div className="relative z-10 h-full">{children}</div>
      </div>
    );
  }
);
SpotlightCard.displayName = 'SpotlightCard';
