#!/bin/bash

echo "Cleaning Next.js build artifacts..."
rm -rf .next

echo "Clearing node_modules (optional - uncomment if needed)"
# rm -rf node_modules

echo "Installing dependencies..."
npm install

echo "Starting development server..."
npm run dev
