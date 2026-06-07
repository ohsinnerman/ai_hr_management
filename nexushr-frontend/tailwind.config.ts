import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a3a6b',
          light: '#2d5a9e',
          dark: '#0f1729',
          50: '#eef3fb',
          100: '#d6e3f5',
          200: '#adc6ea',
          300: '#84a9df',
          400: '#5b8cd4',
          500: '#2d5a9e',
          600: '#1a3a6b',
          700: '#142e56',
          800: '#0f2347',
          900: '#0a1833',
        },
        accent: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
          light: '#fcd34d',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
        },
        background: '#f9f7f4',
        surface: {
          DEFAULT: '#fefdfb',
          2: '#f4f2ee',
          3: '#edeae5',
        },
        muted: { DEFAULT: '#737980', foreground: '#737980' },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#0ea5e9',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(166, 141, 95, 0.06), 0 1px 2px -1px rgba(166, 141, 95, 0.06)',
        'card-md': '0 4px 12px -2px rgba(166, 141, 95, 0.08), 0 2px 4px -2px rgba(166, 141, 95, 0.04)',
        'card-lg': '0 10px 24px -4px rgba(166, 141, 95, 0.10), 0 4px 8px -4px rgba(166, 141, 95, 0.06)',
        'card-xl': '0 20px 40px -8px rgba(166, 141, 95, 0.12), 0 8px 16px -6px rgba(166, 141, 95, 0.06)',
        'glass': '0 8px 32px 0 rgba(166, 141, 95, 0.08)',
        'bento': '0 2px 8px -1px rgba(166, 141, 95, 0.06)',
        'bento-hover': '0 12px 28px -4px rgba(166, 141, 95, 0.12), 0 4px 10px rgba(166, 141, 95, 0.04)',
        'inner-glow': 'inset 0 1px 2px 0 rgba(255, 255, 255, 0.1)',
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spin-slow': 'spin 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.92)' }, to: { opacity: '1', transform: 'scale(1)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      transitionTimingFunction: {
        'snappy': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
