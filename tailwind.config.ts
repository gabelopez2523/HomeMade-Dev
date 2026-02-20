import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff3ed',
          100: '#ffe4d3',
          200: '#ffc9a6',
          300: '#ffac79',
          400: '#ff844d',
          500: '#ff5c00',
          600: '#d44d00',
          700: '#a83d00',
          800: '#7d2e00',
          900: '#521e00',
        },
      },
    },
  },
  plugins: [],
}
export default config


