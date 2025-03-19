#!/bin/bash

echo "===== SUCCESS KID PLATFORM BUILD FIXER ====="
echo "This script will repair common build issues"

# Step 1: Clean build artifacts
echo -e "\n[Step 1/5] Cleaning build artifacts..."
rm -rf .next

# Step 2: Fix the routing issues
echo -e "\n[Step 2/5] Fixing routing issues..."
if [ -d "src/app/(marketing)/home" ]; then
  echo "Updating root page redirection..."
  sed -i '' 's/redirect(.\/home.);/redirect(.\/.);/g' src/app/page.tsx

  echo "Removing unnecessary home directory..."
  rm -rf src/app/(marketing)/home
fi

# Step 3: Add pnpm-specific fix for module resolution
echo -e "\n[Step 3/5] Fixing module resolution..."
cat > .npmrc << EOF
legacy-peer-deps=true
strict-peer-dependencies=false
auto-install-peers=true
resolve-peers-from-workspace-root=true
EOF

# Step 4: Install dependencies
echo -e "\n[Step 4/5] Reinstalling dependencies..."
npm install
# Uncomment the line below if you're using pnpm
# pnpm install

# Step 5: Clear browser data
echo -e "\n[Step 5/5] Final steps..."
echo "Please also clear your browser cache for localhost"

echo -e "\n===== FIX COMPLETE ====="
echo "Now try running:"
echo "npm run dev"
echo "If issues persist, try manually rebuilding the project."
