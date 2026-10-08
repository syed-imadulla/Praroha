/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#F8F4E8',
          100: '#F2EBDD',
          200: '#E8E0D0',
          300: '#D8CCB7',
        },
        sage: {
          900: '#294B3A',
          800: '#355A46',
          700: '#466A55',
          500: '#718875',
          200: '#C8D0BE',
          100: '#DDE2D2',
        },
        terracotta: {
          700: '#A0522D',
          500: '#B8734F',
          200: '#E7C8B5',
        },
        plum: {
          700: '#6A4B67',
          200: '#DCCDD8',
        },
        gold: {
          500: '#C59A55',
          200: '#E9DDBF',
        },
        danger: {
          DEFAULT: '#B85C46',
          soft: '#F1DDD5',
        },
        // Botanical text tokens
        text: {
          primary: '#294B3A',
          body: '#394840',
          muted: '#6D756F',
        },
        // Legacy canvas aliases kept for backward compatibility during phased rollout
        canvas: {
          deep: '#090D16',
          panel: '#0F172A',
          card: '#131D33',
          border: '#1E293B',
          hover: '#1E293B',
        },
        accent: {
          cyan: '#06B6D4',
          'cyan-bright': '#22D3EE',
          emerald: '#10B981',
          'emerald-bright': '#34D399',
          amber: '#F59E0B',
          violet: '#8B5CF6',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        card: '18px',
        panel: '22px',
        pill: '9999px',
      },
      boxShadow: {
        soft: '0 4px 18px rgba(60, 64, 51, 0.045)',
        card: '0 5px 20px rgba(67, 70, 56, 0.05)',
        hover: '0 8px 24px rgba(60, 64, 51, 0.07)',
        'seed-pulse': '0 0 25px rgba(53, 90, 70, 0.25)',
        'terracotta-glow': '0 0 20px rgba(184, 115, 79, 0.2)',
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.3)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
      },
      transitionDuration: {
        180: '180ms',
      },
    },
  },
  plugins: [],
};
