#!/bin/bash
set -e

# Deploy to production environment
echo "Deploying to production environment..."

# Step 1: Build the application
echo "Building application..."
pnpm build

# Step 2: Deploy frontend to Vercel
echo "Deploying frontend to Vercel..."
cd apps/frontend
npx vercel deploy --prod

# Step 3: Deploy backend to production server
echo "Deploying backend to production server..."
cd ../backend
ssh user@production-server.successkid.com << 'ENDSSH'
cd /var/www/successkid-api
git pull
pnpm install
pnpm build
pm2 restart successkid-api
exit
ENDSSH

echo "Production deployment completed successfully!"
