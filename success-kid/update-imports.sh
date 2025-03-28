#!/bin/bash

# Script to update import statements from @/lib/api-client to @/lib/api/api-client
# This will find all TypeScript and TSX files that import from the old path and update them

echo "Updating import statements in TypeScript files..."

# Find all TypeScript and TSX files that import from the old path
find apps/frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "import.*from.*'@/lib/api-client'" {} \; | while read -r file; do
  echo "Updating $file"
  # Replace the import statements
  sed -i '' 's|import { apiClient } from '"'"'@/lib/api-client'"'"'|import { apiClient } from '"'"'@/lib/api/api-client'"'"'|g' "$file"
  sed -i '' 's|import { apiClient, AppError } from '"'"'@/lib/api-client'"'"'|import { apiClient, AppError } from '"'"'@/lib/api/api-client'"'"'|g' "$file"
done

echo "Import statements updated successfully!"
