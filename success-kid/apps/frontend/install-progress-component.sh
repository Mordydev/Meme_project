#!/bin/bash
# Install Radix UI Progress component dependency

# Change to the frontend directory
cd "$(dirname "$0")"

# Install the Radix UI Progress component
npm install @radix-ui/react-progress

echo "Successfully installed @radix-ui/react-progress!"
