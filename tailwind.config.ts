import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        piggie: {
          50: '#FFF8FA',
          100: '#FCEBF0',
          200: '#F9D5E1',
          300: '#F4B6CB',
          400: '#EC8EAE',
          500: '#DF648F',
          600: '#C84673',
          700: '#A6335A',
          800: '#7C2845',
          900: '#4A1829',
          950: '#260B15',
        },
        rosegold: {
          light: '#F8E3D8',
          DEFAULT: '#E5A999',
          medium: '#D38B78',
          dark: '#A96654',
          champagne: '#F5DDC4',
        },
      },
      fontFamily: {
        serif: [
          '"Bodoni MT"',
          'Didot',
          '"Palatino Linotype"',
          '"Book Antiqua"',
          'Georgia',
          'serif',
        ],
        sans: [
          '"Avenir Next"',
          '"Segoe UI"',
          '-apple-system',
          'BlinkMacSystemFont',
          'Roboto',
          'sans-serif',
        ],
      },
      scale: {
        98: '0.98',
        102: '1.02',
      },
      keyframes: {
        'sheet-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'drawer-in': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'toast-pop': {
          '0%': { opacity: '0', transform: 'translate(-50%, 14px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0) scale(1)' },
        },
      },
      animation: {
        'sheet-up': 'sheet-up 260ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'drawer-in': 'drawer-in 240ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'toast-pop': 'toast-pop 240ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
      boxShadow: {
        'rose-glow': '0 0 30px -5px rgba(244, 182, 203, 0.55)',
        'led-strip': '0 0 18px 2px rgba(255, 240, 245, 0.85)',
        'luxury-glass': '0 20px 50px rgba(74, 24, 41, 0.25)',
        'card-lift': '0 16px 40px -12px rgba(74, 24, 41, 0.16)',
        'pill-float': '0 8px 24px -6px rgba(38, 11, 21, 0.24)',
      },
    },
  },
  plugins: [],
};

export default config;
