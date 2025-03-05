import { UserProfile } from '@/components/user/UserProfile';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile | Success Kid Community',
  description: 'View and manage your Success Kid Community profile',
};

export default function ProfilePage() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <h1 className="mb-6 text-3xl font-bold">Your Profile</h1>
      <UserProfile />
    </div>
  );
} 