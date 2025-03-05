/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Match Success Kid brand colors
        'primary': {
          DEFAULT: '#1E88E5', // Victory Blue
          'hover': '#1976D2',
          'active': '#1565C0'
        },
        'secondary': {
          DEFAULT: '#FFC107', // Sand Gold
          'hover': '#FFB300',
          'active': '#FFA000'
        },
        'success': {
          DEFAULT: '#4CAF50', // Success Green
          'hover': '#43A047',
          'active': '#388E3C'
        },
        'error': {
          DEFAULT: '#F44336', // Action Red
          'hover': '#E53935',
          'active': '#D32F2F'
        },
      },
      fontFamily: {
        'heading': ['Montserrat', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'mono': ['Roboto Mono', 'monospace'],
        'accent': ['Rubik', 'sans-serif'],
      },
      spacing: {
        // Match spacing system
        'xs': '2px',
        's': '4px',
        'm': '8px',
        'l': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
        '4xl': '64px',
      },
    },
  },
  plugins: [],
}