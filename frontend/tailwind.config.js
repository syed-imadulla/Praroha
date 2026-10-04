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
        sans: ['Inter', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.3)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
      },
    },
  },
  plugins: [],
};
