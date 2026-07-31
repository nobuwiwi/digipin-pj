/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0faf0',
          100: '#dcf2dc',
          200: '#bce5bc',
          300: '#8dd28d',
          400: '#57b857',
          500: '#339933',
          600: '#228b22',
          700: '#1a6e1a',
          800: '#175617',
          900: '#144714',
          950: '#0a280a',
        },
        sand: {
          50: '#fbf8f0',
          100: '#f5ecd9',
          200: '#e9d5a8',
          300: '#dcbd72',
          400: '#d4a949',
          500: '#c0912e',
          600: '#a37424',
          700: '#82591f',
          800: '#6c491f',
          900: '#5b3e1d',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', '"Hiragino Kaku Gothic ProN"', 'Meiryo', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
