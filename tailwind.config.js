/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        blinkit: {
          yellow: '#F8CB46',
          green: '#0C831F',
          darkgreen: '#055813',
          lightyellow: '#FFF9E6',
          lightgreen: '#E8F7EB',
          dark: '#111827',
          card: '#1F2937'
        }
      }
    },
  },
  plugins: [],
}
