# Tailwind CSS v4 Setup Instructions

## Overview

This project uses Tailwind CSS v4, which has significant changes from v3, including the separation of the PostCSS plugin into its own package (`@tailwindcss/postcss`).

## Setup Steps

1. Ensure you have the correct dependencies installed:
   ```bash
   # Run the installation script
   bash install-tailwind-v4.sh
   ```

2. Verify your PostCSS configuration in `postcss.config.js`:
   ```js
   module.exports = {
     plugins: {
       '@tailwindcss/postcss': {},
       'autoprefixer': {},
     },
   }
   ```

3. Check your tailwind.config.js file:
   ```js
   /** @type {import('tailwindcss').Config} */
   module.exports = {
     // Configuration here
   }
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Known Issues

- Tailwind v4 is still in alpha/beta and may have breaking changes
- Some third-party plugins might not be compatible with v4 yet
- The `@tailwindcss/postcss` package is required for v4 to work with PostCSS

## Debug Indicator

A green "CSS v4 loaded" indicator will appear in the top-left corner of the page if CSS is loaded correctly.

## Troubleshooting

If you encounter issues:

1. Check for errors in the console
2. Verify dependencies are correctly installed
3. Ensure PostCSS is configured correctly
4. Try clearing your .next folder and node_modules:
   ```bash
   rm -rf .next
   rm -rf node_modules
   npm install
   ```

5. If all else fails, you can downgrade to Tailwind CSS v3 by updating your package.json and postcss.config.js
