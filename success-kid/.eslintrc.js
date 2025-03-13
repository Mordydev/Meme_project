module.exports = {
  root: true,
  extends: [
    'next',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:tailwindcss/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'jsx-a11y', 'tailwindcss'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json']
  },
  settings: {
    next: {
      rootDir: ['apps/frontend/']
    },
    tailwindcss: {
      config: 'apps/frontend/tailwind.config.js'
    }
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'tailwindcss/no-custom-classname': 'warn'
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': ['warn', {
          allowExpressions: true,
          allowTypedFunctionExpressions: true
        }]
      }
    },
    {
      files: ['apps/backend/**/*.ts'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'error'
      }
    }
  ]
};