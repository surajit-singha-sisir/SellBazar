import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        accent: {
          50:  '#fdf4ff',
          100: '#fae8ff',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
        },
        surface: {
          50:  '#fafafa',
          100: '#f4f4f5',
          800: '#18181b',
          900: '#09090b',
          950: '#030303',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        bangla: ['Hind Siliguri', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glow':    '0 0 20px rgba(249,115,22,0.35)',
        'glow-lg': '0 0 40px rgba(249,115,22,0.25)',
        'glass':   '0 8px 32px rgba(0,0,0,0.12)',
        'card':    '0 2px 16px rgba(0,0,0,0.08)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-mesh': 'radial-gradient(at 40% 20%, hsla(28,100%,74%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%,   hsla(189,100%,56%,0.1)  0px, transparent 50%), radial-gradient(at 0%  50%,  hsla(355,100%,93%,0.1)  0px, transparent 50%)',
      },
      animation: {
        'float':        'float 6s ease-in-out infinite',
        'shimmer':      'shimmer 1.5s infinite',
        'slide-in-up':  'slideInUp 0.4s ease-out',
        'fade-in':      'fadeIn 0.3s ease-out',
        'bounce-soft':  'bounceSoft 0.6s ease-out',
        'pulse-brand':  'pulseBrand 2s ease-in-out infinite',
      },
      keyframes: {
        float:       { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        shimmer:     { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        slideInUp:   { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:      { from: { opacity: '0' }, to: { opacity: '1' } },
        bounceSoft:  { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.06)' }, '100%': { transform: 'scale(1)' } },
        pulseBrand:  { '0%,100%': { boxShadow: '0 0 0 0 rgba(249,115,22,0.4)' }, '50%': { boxShadow: '0 0 0 10px rgba(249,115,22,0)' } },
      }
    }
  },
  plugins: []
} satisfies Config
