#!/bin/bash
# Install missing dependencies for shadcn/ui components

# Change to the frontend directory
cd "$(dirname "$0")"

# Install the missing radix UI components
npm install @radix-ui/react-progress @radix-ui/react-tooltip

echo "Missing dependencies installed successfully!"
