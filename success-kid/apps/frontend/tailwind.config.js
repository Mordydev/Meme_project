/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
    extend: {
      colors: {
        // Primary color - Victory Blue
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: 'oklch(0.99 0.03 240)',
          100: 'oklch(0.97 0.06 240)',
          200: 'oklch(0.94 0.09 240)',
          300: 'oklch(0.91 0.12 240)',
          400: 'oklch(0.88 0.15 240)',
          500: 'oklch(0.84 0.18 240)',
          600: 'oklch(0.75 0.19 240)',
          700: 'oklch(0.65 0.2 240)',
          800: 'oklch(0.55 0.18 240)',
          900: 'oklch(0.45 0.16 240)',
        },
        // Secondary color - Sand Gold
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          50: 'oklch(0.99 0.03 85)',
          100: 'oklch(0.97 0.06 85)',
          200: 'oklch(0.94 0.09 85)',
          300: 'oklch(0.91 0.12 85)',
          400: 'oklch(0.88 0.15 85)',
          500: 'oklch(0.85 0.18 85)',
          600: 'oklch(0.80 0.19 85)',
          700: 'oklch(0.70 0.18 85)',
          800: 'oklch(0.60 0.16 85)',
          900: 'oklch(0.50 0.14 85)',
        },
        // Accent color - Success Green
        accent: {
          DEFAULT: 'var(--color-accent)',
          50: 'oklch(0.99 0.03 135)',
          100: 'oklch(0.97 0.06 135)',
          200: 'oklch(0.94 0.09 135)',
          300: 'oklch(0.91 0.12 135)',
          400: 'oklch(0.88 0.15 135)',
          500: 'oklch(0.85 0.18 135)',
          600: 'oklch(0.75 0.17 135)',
          700: 'oklch(0.65 0.16 135)',
          800: 'oklch(0.55 0.15 135)',
          900: 'oklch(0.45 0.14 135)',
        },
        // Alert color - Action Red
        alert: {
          DEFAULT: 'var(--color-alert)',
          50: 'oklch(0.99 0.03 35)',
          100: 'oklch(0.97 0.06 35)',
          200: 'oklch(0.94 0.09 35)',
          300: 'oklch(0.91 0.12 35)',
          400: 'oklch(0.88 0.15 35)',
          500: 'oklch(0.85 0.18 35)',
          600: 'oklch(0.75 0.18 35)',
          700: 'oklch(0.65 0.17 35)',
          800: 'oklch(0.55 0.16 35)',
          900: 'oklch(0.45 0.14 35)',
        },
        // Standard interface colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
        accent: ['Rubik', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'pulse-success': {
          '0%, 100%': { 
            opacity: 1,
            transform: 'scale(1)',
          },
          '50%': { 
            opacity: 0.8,
            transform: 'scale(1.05)',
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-success': 'pulse-success 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
