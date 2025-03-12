module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:jsx-a11y/recommended',
    'plugin:tailwindcss/recommended',
    'prettier'
  ],
  plugins: ['jsx-a11y', 'tailwindcss'],
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'tailwindcss/no-custom-classname': 'warn',
    'jsx-a11y/alt-text': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  },
  settings: {
    tailwindcss: {
      callees: ['cn', 'classnames', 'clsx', 'twMerge'],
      config: 'tailwind.config.js'
    }
  }
};
