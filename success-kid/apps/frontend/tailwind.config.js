/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-50": "var(--color-primary-50)",
        "primary-100": "var(--color-primary-100)",
        "primary-200": "var(--color-primary-200)",
        "primary-300": "var(--color-primary-300)",
        "primary-400": "var(--color-primary-400)",
        "primary-500": "var(--color-primary-500)",
        "primary-600": "var(--color-primary-600)",
        "primary-700": "var(--color-primary-700)",
        "primary-800": "var(--color-primary-800)",
        "primary-900": "var(--color-primary-900)",
        
        secondary: "var(--color-secondary)",
        "secondary-50": "var(--color-secondary-50)",
        "secondary-100": "var(--color-secondary-100)",
        "secondary-200": "var(--color-secondary-200)",
        "secondary-300": "var(--color-secondary-300)",
        "secondary-400": "var(--color-secondary-400)",
        "secondary-500": "var(--color-secondary-500)",
        "secondary-600": "var(--color-secondary-600)",
        "secondary-700": "var(--color-secondary-700)",
        "secondary-800": "var(--color-secondary-800)",
        "secondary-900": "var(--color-secondary-900)",
        
        accent: "var(--color-accent)",
        "accent-50": "var(--color-accent-50)",
        "accent-100": "var(--color-accent-100)",
        "accent-200": "var(--color-accent-200)",
        "accent-300": "var(--color-accent-300)",
        "accent-400": "var(--color-accent-400)",
        "accent-500": "var(--color-accent-500)",
        "accent-600": "var(--color-accent-600)",
        "accent-700": "var(--color-accent-700)",
        "accent-800": "var(--color-accent-800)",
        "accent-900": "var(--color-accent-900)",
        
        alert: "var(--color-alert)",
        "alert-50": "var(--color-alert-50)",
        "alert-100": "var(--color-alert-100)",
        "alert-200": "var(--color-alert-200)",
        "alert-300": "var(--color-alert-300)",
        "alert-400": "var(--color-alert-400)",
        "alert-500": "var(--color-alert-500)",
        "alert-600": "var(--color-alert-600)",
        "alert-700": "var(--color-alert-700)",
        "alert-800": "var(--color-alert-800)",
        "alert-900": "var(--color-alert-900)",
        
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      textGradient: {
        'primary': 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
        accent: 'var(--font-accent)',
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
        'success': 'success-pulse 2s var(--ease-fluid) infinite',
        'gradient-pulse': 'gradient-pulse 4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'gradient-rotation': 'gradient-rotation 6s linear infinite',
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'success-pulse': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.9, transform: 'scale(1.05)' },
        },
        'gradient-pulse': {
          '0%, 100%': { opacity: 1, backgroundPosition: '0% 0%' },
          '50%': { opacity: 0.8, backgroundPosition: '100% 100%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 0.6, transform: 'scale(0.98)' },
          '50%': { opacity: 1, transform: 'scale(1.01)' },
        },
        'gradient-rotation': {
          '0%': { backgroundPosition: '0% 50%', backgroundSize: '200% 200%' },
          '50%': { backgroundPosition: '100% 50%', backgroundSize: '200% 200%' },
          '100%': { backgroundPosition: '0% 50%', backgroundSize: '200% 200%' },
        },
      },
      borderRadius: {
        'default': 'var(--radius)',
      },
      transitionTimingFunction: {
        'standard': 'var(--ease-standard)',
        'enter': 'var(--ease-enter)',
        'exit': 'var(--ease-exit)',
        'emphatic': 'var(--ease-emphatic)',
        'fluid': 'var(--ease-fluid)',
        'snappy': 'var(--ease-snappy)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate')
  ],
}
