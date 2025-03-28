import { redirect } from 'next/navigation';

/**
 * Platform route redirect
 * 
 * This redirects /platform to the dashboard
 */
export default function PlatformRedirectPage() {
  redirect('/dashboard');
}

// Force immediate redirect
export const dynamic = 'force-dynamic';
