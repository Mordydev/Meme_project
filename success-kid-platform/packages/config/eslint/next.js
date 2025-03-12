module.exports = {
  extends: [
    './typescript',
    'next/core-web-vitals',
    'plugin:jsx-a11y/recommended',
    'plugin:tailwindcss/recommended'
  ],
  plugins: ['jsx-a11y', 'tailwindcss', 'react-hooks'],
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'tailwindcss/no-custom-classname': 'warn',
    'jsx-a11y/anchor-is-valid': 'warn'
  }
};