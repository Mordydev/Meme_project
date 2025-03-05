#!/bin/bash

# Success Kid Community Platform - Supabase Setup Script

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Please install it first."
    echo "Visit https://supabase.com/docs/guides/cli for installation instructions."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

echo "=== Setting up Supabase for Success Kid Community Platform ==="

# Start Supabase local development
echo "Starting Supabase local development..."
supabase start

# Apply migrations
echo "Applying database migrations..."
supabase db push

# Load seed data
echo "Loading seed data..."
supabase db execute < apps/api/supabase/seed-data/categories.sql
supabase db execute < apps/api/supabase/seed-data/achievements.sql

# Deploy Edge Functions
echo "Deploying Edge Functions..."
supabase functions deploy wallet-verification
supabase functions deploy user-points
supabase functions deploy market-data

echo "=== Supabase setup completed successfully ==="
echo "Local Supabase Studio URL: http://localhost:54323"
echo "Local API URL: http://localhost:54321"
echo ""
echo "You can now set up your environment variables:"
echo "NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$(supabase status | grep anon | awk '{print $3}')"

echo ""
echo "Happy coding!" 