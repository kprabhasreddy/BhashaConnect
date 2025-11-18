/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#EA580C',
          light: '#F97316',
        },
        secondary: {
          DEFAULT: '#16A34A',
          light: '#22C55E',
        },
      },
    },
  },
  plugins: [],
}

