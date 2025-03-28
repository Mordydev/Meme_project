import { redirect } from 'next/navigation';

/**
 * Root page redirect
 * 
 * This page redirects to the marketing homepage
 */
export default function RootPage() {
  // Redirect to the marketing page - note we use the actual path, not the route group
  redirect('/');
}

// Force immediate redirect
export const dynamic = 'force-dynamic';

