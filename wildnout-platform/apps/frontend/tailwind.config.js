import { fontFamily } from "tailwindcss/defaultTheme"

/** @type {import('tailwindcss').Config} */
export const config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        // Brand colors from design system
        "wild-black": "rgb(var(--color-wild-black) / <alpha-value>)",
        "battle-yellow": "rgb(var(--color-battle-yellow) / <alpha-value>)",
        "hype-white": "rgb(var(--color-hype-white) / <alpha-value>)",
        "victory-green": "rgb(var(--color-victory-green) / <alpha-value>)",
        "roast-red": "rgb(var(--color-roast-red) / <alpha-value>)",
        "flow-blue": "rgb(var(--color-flow-blue) / <alpha-value>)",
        
        // Semantic colors
        "background": "var(--color-background)",
        "foreground": "var(--color-foreground)",
        "primary": "var(--color-primary)",
        "primary-foreground": "var(--color-primary-foreground)",
        "secondary": "var(--color-secondary)",
        "secondary-foreground": "var(--color-secondary-foreground)",
        "accent": "var(--color-accent)",
        "accent-foreground": "var(--color-accent-foreground)",
        "destructive": "var(--color-destructive)",
        "destructive-foreground": "var(--color-destructive-foreground)",
        
        // Gray scale
        "zinc": {
          50: "rgb(var(--color-zinc-50) / <alpha-value>)",
          100: "rgb(var(--color-zinc-100) / <alpha-value>)",
          200: "rgb(var(--color-zinc-200) / <alpha-value>)",
          300: "rgb(var(--color-zinc-300) / <alpha-value>)",
          400: "rgb(var(--color-zinc-400) / <alpha-value>)",
          500: "rgb(var(--color-zinc-500) / <alpha-value>)",
          600: "rgb(var(--color-zinc-600) / <alpha-value>)",
          700: "rgb(var(--color-zinc-700) / <alpha-value>)",
          800: "rgb(var(--color-zinc-800) / <alpha-value>)",
          900: "rgb(var(--color-zinc-900) / <alpha-value>)",
          950: "rgb(var(--color-zinc-950) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", ...fontFamily.sans],
        body: ["var(--font-body)", ...fontFamily.sans],
        accent: ["var(--font-accent)", ...fontFamily.sans],
      },
      spacing: {
        // Access --space-{n} variables from CSS
        // All mt-4, p-6, gap-8 etc. will use the spacing token system
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      transitionDuration: {
        instant: "var(--duration-instant)",
        quick: "var(--duration-quick)",
        standard: "var(--duration-standard)",
        emphasis: "var(--duration-emphasis)",
        celebration: "var(--duration-celebration)",
      },
      transitionTimingFunction: {
        standard: "var(--easing-standard)",
        energetic: "var(--easing-energetic)",
        bounce: "var(--easing-bounce)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
        "celebrate": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "70%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-5deg)" },
          "75%": { transform: "rotate(5deg)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "battle-entrance": {
          "0%": { transform: "translateY(20px) scale(0.9)", opacity: "0" },
          "60%": { transform: "translateY(-5px) scale(1.02)", opacity: "1" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in var(--duration-standard) var(--easing-entrance)",
        "fade-out": "fade-out var(--duration-standard) var(--easing-exit)",
        "slide-up": "slide-up var(--duration-standard) var(--easing-entrance)",
        "slide-down": "slide-down var(--duration-standard) var(--easing-entrance)",
        "pulse-glow": "pulse-glow 2s var(--easing-standard) infinite",
        "scale-in": "scale-in var(--duration-standard) var(--easing-entrance)",
        "scale-out": "scale-out var(--duration-standard) var(--easing-exit)",
        "celebrate": "celebrate var(--duration-celebration) var(--easing-bounce)",
        "wiggle": "wiggle 1s var(--easing-bounce) infinite",
        "float": "float 3s var(--easing-standard) infinite",
        "battle-entrance": "battle-entrance var(--duration-emphasis) var(--easing-energetic)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
}

export default config
