#!/bin/bash
set -e

# Deploy to staging environment
echo "Deploying to staging environment..."

# Step 1: Build the application
echo "Building application..."
pnpm build

# Step 2: Deploy frontend to Vercel
echo "Deploying frontend to Vercel..."
cd apps/frontend
npx vercel deploy --prod

# Step 3: Deploy backend to staging server
echo "Deploying backend to staging server..."
cd ../backend
ssh user@staging-server.successkid.com << 'ENDSSH'
cd /var/www/successkid-api
git pull
pnpm install
pnpm build
pm2 restart successkid-api
exit
ENDSSH

echo "Staging deployment completed successfully!"
