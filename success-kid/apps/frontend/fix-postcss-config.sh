#!/bin/bash
# Fix PostCSS configuration for Next.js 15.2

set -e # Exit immediately if a command exits with a non-zero status

# Change to the frontend directory
cd "$(dirname "$0")"

# Create a backup of the current postcss.config.js
cp postcss.config.js postcss.config.js.backup

# Update PostCSS configuration to be compatible with Next.js 15.2
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Install required dependencies
npm install --save-dev autoprefixer

echo "PostCSS configuration updated successfully!"
echo "Please run 'npm run build' to test if the issue is resolved."
