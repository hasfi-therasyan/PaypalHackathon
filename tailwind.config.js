/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paypal: {
          blue: '#0070ba',
          dark: '#003087',
          light: '#0079c1',
          hover: '#005ea6',
          gold: '#ffc439',
          goldHover: '#f2ba36',
          softBg: '#f5f9fc',
        },
      },
    },
  },
  plugins: [],
}
