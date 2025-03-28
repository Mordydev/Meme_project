#!/bin/bash
set -e

# Rollback production environment to a previous version
echo "Rolling back production environment..."

# Get the commit hash to roll back to (default to the previous commit)
COMMIT_HASH=${1:-$(git rev-parse HEAD~1)}
echo "Rolling back to commit: $COMMIT_HASH"

# Step 1: Check out the commit
git checkout $COMMIT_HASH

# Step 2: Build the application
echo "Building application..."
pnpm install
pnpm build

# Step 3: Deploy frontend to Vercel
echo "Deploying frontend to Vercel..."
cd apps/frontend
npx vercel deploy --prod

# Step 4: Deploy backend to production server
echo "Deploying backend to production server..."
cd ../backend
ssh user@production-server.successkid.com << 'ENDSSH'
cd /var/www/successkid-api
git fetch
git checkout $COMMIT_HASH
pnpm install
pnpm build
pm2 restart successkid-api
exit
ENDSSH

echo "Production rollback completed successfully!"
