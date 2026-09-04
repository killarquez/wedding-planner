/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf9f0',
          100: '#f6f1dc',
          200: '#eee3b8',
          300: '#e3ce8a',
          400: '#d7b75c',
          500: '#c59f3d',
          600: '#aa802e',
          700: '#886026',
          800: '#6f4e24',
          900: '#5c4122',
        },
        crimson: {
          50: '#fdf2f2',
          100: '#fce7e7',
          200: '#f9d2d3',
          300: '#f4afb0',
          400: '#eb7e81',
          500: '#dd4d52',
          600: '#c53238',
          700: '#a3242a',
          800: '#872126',
          900: '#721f24',
          950: '#3f0b0d',
        },
        lotus: {
          50: '#fff1f4',
          100: '#ffe4ea',
          200: '#fecdd7',
          300: '#fda4b8',
          400: '#fb7193',
          500: '#f43f6e',
          600: '#e11d53',
          700: '#be1241',
          800: '#9f123a',
          900: '#881337',
        },
        jade: {
          50: '#f0fdf7',
          100: '#dcfce9',
          200: '#bbf7d4',
          300: '#86efb4',
          400: '#4ade8e',
          500: '#22c569',
          600: '#16a352',
          700: '#158043',
          800: '#166538',
          900: '#145330',
          950: '#062d19',
        },
        royal: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#1e1b4b',
        },
        emerald: {
          850: '#064e3b',
          950: '#022c22',
        }
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-subtle': 'pulseSubtle 3s infinite',
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.95', transform: 'scale(1.02)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(3deg)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.08)' },
        },
      }
    },
  },
  plugins: [],
};
