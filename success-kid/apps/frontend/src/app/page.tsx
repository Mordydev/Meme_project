import { redirect } from 'next/navigation';

/**
 * Root page redirect
 * 
 * This page redirects to the marketing homepage since we're using route groups
 */
export default function RootPage() {
  redirect('/(marketing)');
}
