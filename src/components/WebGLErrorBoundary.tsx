'use client';

import React from 'react';

interface State {
  hasError: boolean;
}

export class WebGLErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative flex h-full w-full items-center justify-center text-alabaster">
          <svg viewBox="0 0 400 400" className="h-80 w-80 opacity-65">
            <circle cx="200" cy="200" r="136" fill="none" stroke="currentColor" strokeOpacity="0.16" strokeWidth="0.75" />
            <ellipse cx="200" cy="200" rx="136" ry="52" fill="none" stroke="rgb(var(--c-sand))" strokeOpacity="0.35" strokeWidth="0.75" transform="rotate(-24 200 200)" />
            <path d="M 130 225 Q 200 105 270 165" fill="none" stroke="rgb(var(--c-sand))" strokeWidth="1.2" />
            <circle cx="130" cy="225" r="3" fill="rgb(var(--c-sand))" />
            <circle cx="270" cy="165" r="3.5" fill="currentColor" />
          </svg>
        </div>
      );
    }
    return this.props.children;
  }
}
