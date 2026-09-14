/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rose: {
          DEFAULT: '#C2617A',
          light: '#F5DDE4',
          mid: '#E8A0B0',
          dark: '#8B3A50',
        },
        blush: '#FAF0F3',
        sand: {
          DEFAULT: '#F7F3EE',
          mid: '#EDE6DC',
          dark: '#B8A898',
        },
        mauve: {
          DEFAULT: '#7B5EA7',
          light: '#EDE8F7',
          mid: '#C4B3E0',
        },
        sage: {
          DEFAULT: '#5A8A6A',
          light: '#E8F4EC',
        },
        amber: {
          DEFAULT: '#C47E2A',
          light: '#FDF1DC',
        },
        ink: {
          DEFAULT: '#2D1F28',
          mid: '#6B5560',
          light: '#A08898',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        arabic: ['"Amiri"', 'serif'],
      },
    },
  },
  plugins: [],
}
