import { redirect } from 'next/navigation';

/**
 * Explore Page Redirect
 * 
 * Redirects users from the /explore route to the /discover route
 * as part of the platform consolidation
 */
export default function ExploreRedirect() {
  redirect('/discover');
}
