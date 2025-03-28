/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E88E5',
        secondary: '#FFC107',
        accent: '#4CAF50',
        alert: '#F44336',
        background: '#F8FAFC',
        foreground: '#1E293B',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}