import { redirect } from 'next/navigation';

/**
 * Forum Category Redirect
 * 
 * Redirects users from the /forum/category route to the /community/category route
 * as part of the platform consolidation
 */
export default function ForumCategoryRedirect() {
  redirect('/community/category');
}
