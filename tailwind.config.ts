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
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'rose-glow': '0 0 30px -5px rgba(244, 182, 203, 0.55)',
        'led-strip': '0 0 18px 2px rgba(255, 240, 245, 0.85)',
        'luxury-glass': '0 20px 50px rgba(74, 24, 41, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
