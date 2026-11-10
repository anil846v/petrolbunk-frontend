/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ea580c',   /* IOCL Saffron Flame */
          dark:    '#c2410c',
          light:   '#ffedd5',
        },
        iocl: {
          navy:      '#0b1329',
          navyDark:  '#070d1e',
          blue:      '#1d4ed8',
          blueLight: '#eff6ff',
          saffron:   '#ea580c',
          amber:     '#f59e0b',
        },
        success: {
          DEFAULT: '#059669',
          light:   '#d1fae5',
        },
        warning: {
          DEFAULT: '#d97706',
          light:   '#fef3c7',
        },
        danger: {
          DEFAULT: '#dc2626',
          light:   '#fee2e2',
        },
        neutral: {
          bg:     '#f8fafc',
          border: '#e2e8f0',
          text:   '#0f172a',
          muted:  '#64748b',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
