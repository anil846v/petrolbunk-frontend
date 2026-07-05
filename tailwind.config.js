/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          dark:    '#1d4ed8',
          light:   '#dbeafe',
        },
        success: {
          DEFAULT: '#16a34a',
          light:   '#dcfce7',
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
          bg:     '#f4f6fb',
          border: '#e5e7eb',
          text:   '#1f2937',
          muted:  '#6b7280',
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
