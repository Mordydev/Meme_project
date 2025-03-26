/**
 * Custom TailwindCSS plugins for Success Kid platform
 */

/**
 * Plugin for ensuring utility classes are generated for our custom colors
 */
const colorUtilities = ({ addUtilities }) => {
  // This is a fallback to ensure the utility classes are generated
  // even if they're not detected in the content files
  const colorUtilities = {
    '.bg-primary': { backgroundColor: 'var(--color-primary)' },
    '.bg-primary-50': { backgroundColor: 'var(--color-primary-50)' },
    '.bg-primary-100': { backgroundColor: 'var(--color-primary-100)' },
    '.bg-primary-200': { backgroundColor: 'var(--color-primary-200)' },
    '.bg-primary-300': { backgroundColor: 'var(--color-primary-300)' },
    '.bg-primary-400': { backgroundColor: 'var(--color-primary-400)' },
    '.bg-primary-500': { backgroundColor: 'var(--color-primary-500)' },
    '.bg-primary-600': { backgroundColor: 'var(--color-primary-600)' },
    '.bg-primary-700': { backgroundColor: 'var(--color-primary-700)' },
    '.bg-primary-800': { backgroundColor: 'var(--color-primary-800)' },
    '.bg-primary-900': { backgroundColor: 'var(--color-primary-900)' },
    
    '.bg-secondary': { backgroundColor: 'var(--color-secondary)' },
    '.bg-secondary-50': { backgroundColor: 'var(--color-secondary-50)' },
    '.bg-secondary-100': { backgroundColor: 'var(--color-secondary-100)' },
    '.bg-secondary-200': { backgroundColor: 'var(--color-secondary-200)' },
    '.bg-secondary-300': { backgroundColor: 'var(--color-secondary-300)' },
    '.bg-secondary-400': { backgroundColor: 'var(--color-secondary-400)' },
    '.bg-secondary-500': { backgroundColor: 'var(--color-secondary-500)' },
    '.bg-secondary-600': { backgroundColor: 'var(--color-secondary-600)' },
    '.bg-secondary-700': { backgroundColor: 'var(--color-secondary-700)' },
    '.bg-secondary-800': { backgroundColor: 'var(--color-secondary-800)' },
    '.bg-secondary-900': { backgroundColor: 'var(--color-secondary-900)' },
    
    '.bg-accent': { backgroundColor: 'var(--color-accent)' },
    '.bg-accent-50': { backgroundColor: 'var(--color-accent-50)' },
    '.bg-accent-100': { backgroundColor: 'var(--color-accent-100)' },
    '.bg-accent-200': { backgroundColor: 'var(--color-accent-200)' },
    '.bg-accent-300': { backgroundColor: 'var(--color-accent-300)' },
    '.bg-accent-400': { backgroundColor: 'var(--color-accent-400)' },
    '.bg-accent-500': { backgroundColor: 'var(--color-accent-500)' },
    '.bg-accent-600': { backgroundColor: 'var(--color-accent-600)' },
    '.bg-accent-700': { backgroundColor: 'var(--color-accent-700)' },
    '.bg-accent-800': { backgroundColor: 'var(--color-accent-800)' },
    '.bg-accent-900': { backgroundColor: 'var(--color-accent-900)' },
    
    '.bg-alert': { backgroundColor: 'var(--color-alert)' },
    '.bg-alert-50': { backgroundColor: 'var(--color-alert-50)' },
    '.bg-alert-100': { backgroundColor: 'var(--color-alert-100)' },
    '.bg-alert-200': { backgroundColor: 'var(--color-alert-200)' },
    '.bg-alert-300': { backgroundColor: 'var(--color-alert-300)' },
    '.bg-alert-400': { backgroundColor: 'var(--color-alert-400)' },
    '.bg-alert-500': { backgroundColor: 'var(--color-alert-500)' },
    '.bg-alert-600': { backgroundColor: 'var(--color-alert-600)' },
    '.bg-alert-700': { backgroundColor: 'var(--color-alert-700)' },
    '.bg-alert-800': { backgroundColor: 'var(--color-alert-800)' },
    '.bg-alert-900': { backgroundColor: 'var(--color-alert-900)' },
    
    '.bg-background': { backgroundColor: 'var(--background)' },
    '.bg-foreground': { backgroundColor: 'var(--foreground)' },
    '.bg-card': { backgroundColor: 'var(--card)' },
    '.bg-popover': { backgroundColor: 'var(--popover)' },
    '.bg-muted': { backgroundColor: 'var(--muted)' },
    
    '.text-primary': { color: 'var(--color-primary)' },
    '.text-secondary': { color: 'var(--color-secondary)' },
    '.text-accent': { color: 'var(--color-accent)' },
    '.text-alert': { color: 'var(--color-alert)' },
    '.text-background': { color: 'var(--background)' },
    '.text-foreground': { color: 'var(--foreground)' },
    '.text-card-foreground': { color: 'var(--card-foreground)' },
    '.text-popover-foreground': { color: 'var(--popover-foreground)' },
    '.text-muted-foreground': { color: 'var(--muted-foreground)' },
    
    '.border-border': { borderColor: 'var(--border)' },
    '.border-input': { borderColor: 'var(--input)' },
    '.ring-ring': { ringColor: 'var(--ring)' },
  };

  addUtilities(colorUtilities);
};

module.exports = { colorUtilities };
