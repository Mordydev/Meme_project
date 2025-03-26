#!/bin/bash
# Fix the uuid import error

# Change to the frontend directory
cd "$(dirname "$0")"

# Install uuid and its types
echo "Installing uuid package and TypeScript types..."
npm install uuid
npm install --save-dev @types/uuid

echo "UUID package and its TypeScript types installed successfully!"
echo "The build error should now be resolved."
