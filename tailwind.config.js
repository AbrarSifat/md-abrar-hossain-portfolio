/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['var(--font-cormorant-garamond)', 'Cormorant Garamond', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      colors: {
        void: 'rgb(var(--c-void) / <alpha-value>)',
        obsidian: 'rgb(var(--c-obsidian) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        alabaster: 'rgb(var(--c-alabaster) / <alpha-value>)',
        sand: {
          DEFAULT: 'rgb(var(--c-sand) / <alpha-value>)',
          light: 'rgb(var(--c-sand-light) / <alpha-value>)',
        },
        champagne: {
          DEFAULT: 'rgb(var(--c-sand) / <alpha-value>)',
          light: 'rgb(var(--c-sand-light) / <alpha-value>)',
          muted: 'rgb(var(--c-sand) / 0.1)',
        },
        ink: {
          DEFAULT: 'rgb(var(--c-alabaster) / <alpha-value>)',
          secondary: 'rgb(var(--c-ink-secondary) / <alpha-value>)',
          muted: 'rgb(var(--c-ink-muted) / <alpha-value>)',
          subtle: 'rgb(var(--c-ink-subtle) / <alpha-value>)',
          faint: 'rgb(var(--c-ink-faint) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
