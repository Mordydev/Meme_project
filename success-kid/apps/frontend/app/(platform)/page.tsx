import { redirect } from 'next/navigation';

/**
 * Platform root page - redirects to the dashboard
 */
export default function PlatformPage() {
  redirect('/platform/dashboard');
}
