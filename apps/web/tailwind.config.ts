import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ana Renkler
        'kutuphane': {
          bg: '#1a1814',
          'bg-light': '#242019',
          card: '#2d2820',
          'card-hover': '#3a332a',
        },
        // Primary (Amber/Gold)
        'primary': {
          DEFAULT: '#d97706',
          hover: '#b45309',
          light: '#fbbf24',
          lighter: '#fcd34d',
        },
        // Accent
        'accent': {
          DEFAULT: '#92400e',
          light: '#b45309',
        },
        // Custom Neutrals
        'cream': '#fef3c7',
        'gray-custom': '#a8a29e',
        'gray-custom-light': '#d6d3d1',
        'dark-gray': '#78716c',
        // Durum Renkleri
        'success': {
          DEFAULT: '#22c55e',
          light: '#dcfce7',
          dark: '#15803d',
        },
        'error': {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
          dark: '#dc2626',
        },
        'warning': {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
          dark: '#d97706',
        },
        'info': {
          DEFAULT: '#3b82f6',
          light: '#dbeafe',
          dark: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(217, 119, 6, 0.3)',
        'glow-strong': '0 0 40px rgba(217, 119, 6, 0.5)',
        'inner-custom': 'inset 0 2px 4px rgba(0,0,0,0.3)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
};

export default config;
