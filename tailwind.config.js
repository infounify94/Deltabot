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
        brand: {
          50: '#fff8f1',
          100: '#feeedb',
          200: '#fcd9b3',
          300: '#fabf82',
          400: '#f79f4c',
          500: '#f09455',
          600: '#e27625',
          700: '#c45a1b',
          800: '#9d471b',
          900: '#7e3c1a',
        },
        obsidian: {
          950: '#07080a',
          900: '#0c0d10',
          850: '#121419',
          800: '#16181d',
          700: '#1b1e24',
          600: '#262a33',
        },
        pine: {
          DEFAULT: '#10b981',
          tint: '#0f2a22',
          light: '#4fc79b',
        },
        clay: {
          DEFAULT: '#ef4444',
          tint: '#2b1512',
          light: '#e8776a',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'ticker': 'ticker 40s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
