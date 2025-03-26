#!/bin/bash
# Install uuid package and its TypeScript types

# Change to the frontend directory
cd "$(dirname "$0")"

# Install uuid and its types
npm install uuid
npm install --save-dev @types/uuid

echo "UUID package and its TypeScript types installed successfully!"
