/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-50': 'rgb(var(--color-primary-50) / <alpha-value>)',
        'primary-100': 'rgb(var(--color-primary-100) / <alpha-value>)',
        'primary-600': 'rgb(var(--color-primary) / 0.9)',
        'primary-700': 'rgb(var(--color-primary) / 0.8)',
        'primary-900': 'rgb(var(--color-primary-900) / <alpha-value>)',
        
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        'secondary-600': 'rgb(var(--color-secondary) / 0.9)',
        'secondary-700': 'rgb(var(--color-secondary) / 0.8)',
        
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        alert: 'rgb(var(--color-alert) / <alpha-value>)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      spacing: {
        '2xs': '4px',   // 0.25rem
        'xs': '8px',    // 0.5rem
        'sm': '12px',   // 0.75rem
        'md': '16px',   // 1rem
        'lg': '24px',   // 1.5rem
        'xl': '32px',   // 2rem
        '2xl': '48px',  // 3rem
        '3xl': '64px',  // 4rem
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-subtle': 'bounce 1.5s infinite ease-in-out alternate',
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate')
  ],
}
