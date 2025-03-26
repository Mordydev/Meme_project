import { redirect } from 'next/navigation';

/**
 * Forum Thread Redirect
 * 
 * Redirects users from the /forum/thread/[id] route to the /community/post/[id] route
 * as part of the platform consolidation
 */
export default function ForumThreadRedirect({ params }: { params: { id: string } }) {
  const { id } = params;
  redirect(`/community/post/${id}`);
}
