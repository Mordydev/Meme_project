import { redirect } from 'next/navigation';

/**
 * Marketing path redirect
 * 
 * This redirects /marketing to the root path which has the marketing homepage
 */
export default function MarketingRedirectPage() {
  redirect('/');
}

// Force immediate redirect
export const dynamic = 'force-dynamic';
