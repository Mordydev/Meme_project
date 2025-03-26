import { redirect } from 'next/navigation';

/**
 * Forum Page Redirect
 * 
 * Redirects users from the /forum route to the /community route
 * as part of the platform consolidation
 */
export default function ForumRedirect() {
  redirect('/community');
}
