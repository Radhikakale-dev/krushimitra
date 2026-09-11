/** @type {import('tailwindcss').Config} */
export default {
  // Enable class-based dark mode (toggled via ThemeContext adding 'dark' to <html>)
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // ── Typography ───────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // ── Brand Color Palette ──────────────────────────────────────────────────
      colors: {
        background: 'rgba(var(--color-bg-base), <alpha-value>)',
        surface: 'rgba(var(--color-bg-surface), <alpha-value>)',
        'surface-hover': 'rgba(var(--color-bg-surface-hover), <alpha-value>)',
        divider: 'rgba(var(--color-border), <alpha-value>)',
        content: 'rgba(var(--color-text-base), <alpha-value>)',
        'content-muted': 'rgba(var(--color-text-muted), <alpha-value>)',

        // Primary — Emerald Green (Agriculture theme)
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Dark backgrounds
        dark: {
          800:  '#1e293b',
          850:  '#162032',
          900:  '#0f172a',
          950:  '#020617',
        },
        // Accent — Amber for POS/billing highlights
        accent: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },

      // ── Spacing Extensions ───────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '72': '18rem',
        '80': '20rem',
        '88': '22rem',
        '96': '24rem',
      },

      // ── Border Radius ────────────────────────────────────────────────────────
      borderRadius: {
        '4xl': '2rem',
      },

      // ── Box Shadows ──────────────────────────────────────────────────────────
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card':  '0 4px 24px rgba(0, 0, 0, 0.3)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
      },

      // ── Backdrop Blur ────────────────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
      },

      // ── Animations ───────────────────────────────────────────────────────────
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'shake':      'shake 0.4s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%':      { transform: 'translateX(-6px)' },
          '75%':      { transform: 'translateX(6px)' },
        },
      },

      // ── Screen Breakpoints ───────────────────────────────────────────────────
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
};
