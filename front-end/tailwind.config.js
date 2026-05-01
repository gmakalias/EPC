/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        epc: {
          blue: '#2563eb',
          slate: '#1e293b',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        serif: ['Crimson Pro', 'serif'],
      },
    },
  },
  plugins: [],
}