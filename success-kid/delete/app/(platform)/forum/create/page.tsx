import { redirect } from 'next/navigation';

/**
 * Forum Create Post Redirect
 * 
 * Redirects users from the /forum/create route to the /community/create route
 * as part of the platform consolidation
 */
export default function ForumCreateRedirect() {
  redirect('/community/create');
}
