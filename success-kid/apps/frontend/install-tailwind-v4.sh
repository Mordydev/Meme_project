#!/bin/bash

# This script installs Tailwind CSS v4 and its dependencies
echo "Installing Tailwind CSS v4 and dependencies..."

# Install required packages
npm install --save-dev tailwindcss@4.0.16 @tailwindcss/postcss@4.0.16 autoprefixer postcss

# Verify installation
echo "Verifying installation..."
npx tailwindcss --version

echo "Installation complete! Please run 'npm run dev' to start the development server."
