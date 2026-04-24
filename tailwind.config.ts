import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nebula: {
          50:  '#f3f0ff',
          100: '#e9e3ff',
          200: '#d5caff',
          300: '#b8a5ff',
          400: '#9575ff',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0764',
          950: '#1e0040',
        },
        surface: {
          DEFAULT: '#0f0a1a',
          50:  '#1a1130',
          100: '#16092a',
          200: '#120824',
          300: '#0d061c',
        },
        border: {
          DEFAULT: 'rgba(139, 92, 246, 0.2)',
          hover:  'rgba(139, 92, 246, 0.4)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'nebula-gradient': 'linear-gradient(135deg, #0f0a1a 0%, #1a0533 50%, #0d1a3a 100%)',
        'card-gradient':   'linear-gradient(135deg, rgba(26,17,48,0.8) 0%, rgba(13,6,28,0.9) 100%)',
        'glow-purple':     'radial-gradient(circle at center, rgba(124,58,237,0.15) 0%, transparent 70%)',
        'glow-blue':       'radial-gradient(circle at center, rgba(37,99,235,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-sm':  '0 0 10px rgba(124,58,237,0.3)',
        'glow-md':  '0 0 20px rgba(124,58,237,0.4)',
        'glow-lg':  '0 0 40px rgba(124,58,237,0.5)',
        'card':     '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-out',
        'slide-up':     'slideUp 0.3s ease-out',
        'slide-left':   'slideLeft 0.3s ease-out',
        'glow-pulse':   'glowPulse 2s ease-in-out infinite',
        'float':        'float 3s ease-in-out infinite',
        'shimmer':      'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },             to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideLeft: { from: { opacity: '0', transform: 'translateX(8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        glowPulse: { '0%,100%': { boxShadow: '0 0 10px rgba(124,58,237,0.3)' }, '50%': { boxShadow: '0 0 30px rgba(124,58,237,0.7)' } },
        float:     { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};

export default config;
