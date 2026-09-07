/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core Deep Dark Backgrounds
        obsidian: '#050505',
        'obsidian-light': '#0A0A0C',
        
        // Subtle Aurora Accents
        aurora: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          teal: '#14b8a6',
          indigo: '#4f46e5',
        },

        // Glass UI Tokens
        glass: {
          panel: 'rgba(255, 255, 255, 0.03)',
          border: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.06)',
          highlight: 'rgba(255, 255, 255, 0.15)',
        },

        brand: {
          50: '#fffbeb',
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
        slate: {
          850: '#172033',
          900: '#0f172a',
          950: '#090a0f',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-mono)', 'IBM Plex Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'card': '1rem', // 16px radius for premium feel
        'card-lg': '1.5rem', // 24px
      },
      boxShadow: {
        'subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'subtle-md': '0 10px 30px -5px rgba(0, 0, 0, 0.6)',
        'aurora-glow': '0 0 40px -10px rgba(79, 70, 229, 0.15)',
      },
      animation: {
        'ticker': 'ticker 45s linear infinite',
        'aurora-shift': 'aurora-shift 15s ease infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'aurora-shift': {
          '0%, 100%': { transform: 'scale(1) translate(0px, 0px)' },
          '33%': { transform: 'scale(1.1) translate(30px, -50px)' },
          '66%': { transform: 'scale(0.9) translate(-20px, 20px)' },
        }
      },
      backgroundImage: {
        'aurora-gradient': 'radial-gradient(ellipse at top, rgba(79, 70, 229, 0.15), transparent 50%), radial-gradient(ellipse at right, rgba(139, 92, 246, 0.15), transparent 50%), radial-gradient(ellipse at bottom left, rgba(20, 184, 166, 0.15), transparent 50%)',
      }
    },
  },
  plugins: [],
};
