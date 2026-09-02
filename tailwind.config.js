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
        }
      }
    },
  },
  plugins: [],
};
