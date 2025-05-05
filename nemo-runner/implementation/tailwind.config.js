/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': 'var(--color-primary)',
        'secondary': 'var(--color-secondary)',
        'deep-sea': 'var(--color-deep-sea)',
        'mid-water': 'var(--color-mid-water)',
        'surface': 'var(--color-surface)',
        'coral': 'var(--color-coral)',
        'seaweed': 'var(--color-seaweed)',
        'sand': 'var(--color-sand)',
        'bubbles': 'var(--color-bubbles)',
        'text-dark': 'var(--color-text-dark)',
        'danger': 'var(--color-danger)',
      },
    },
  },
  plugins: [],
}

