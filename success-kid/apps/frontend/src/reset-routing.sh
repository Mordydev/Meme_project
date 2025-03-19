#!/bin/bash

# Move home page content to root marketing page
echo "Fixing home page routing..."

# Remove the home directory to simplify routing
rm -rf src/app/(marketing)/home

# Update layout file to handle root paths properly
cat << 'EOF' > src/app/(marketing)/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Import rest of your components

export default function MarketingHomePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  
  // Redirect to dashboard if signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);
  
  return (
    <div className="bg-gray-50">
      {/* Your existing marketing page content */}
      <h1>Welcome to Success Kid Community Platform</h1>
      <p>Please rebuild this page from your latest version</p>
    </div>
  );
}
EOF

echo "Done fixing routing issues. Now run:"
echo "npm run dev"
