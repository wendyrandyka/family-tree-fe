/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        parchment: {
          50: '#fdf8f0',
          100: '#f9eedc',
          200: '#f2dbb8',
          300: '#e8c28a',
          400: '#dca05c',
          500: '#d08040',
          600: '#b86030',
          700: '#964828',
          800: '#7a3820',
          900: '#632e1a',
        },
        forest: {
          50: '#f0f7f0',
          100: '#d8ecd8',
          200: '#b0d8b0',
          300: '#80bc80',
          400: '#52a052',
          500: '#2e7d2e',
          600: '#226022',
          700: '#1a4a1a',
          800: '#123812',
          900: '#0a280a',
        },
        ink: {
          50: '#f5f3f0',
          100: '#e8e2d8',
          200: '#d0c8b0',
          300: '#b0a080',
          400: '#8a7860',
          500: '#685040',
          600: '#503830',
          700: '#382820',
          800: '#241a14',
          900: '#140e0a',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.35s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(24px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};
