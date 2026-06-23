import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3ee',
          100: '#fde5d7',
          200: '#fac7ae',
          300: '#f7a07b',
          400: '#f26e45',
          500: '#ee4821',
          600: '#df3117',
          700: '#b92215',
          800: '#931e19',
          900: '#771c18',
          950: '#400a0a',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'sans-serif'],
        heading: ['Playfair Display', 'Noto Serif SC', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
