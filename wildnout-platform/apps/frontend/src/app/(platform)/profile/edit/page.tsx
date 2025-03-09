import { Metadata } from 'next';
import { currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { ProfileEditor } from '@/components/features/profile';

export const metadata: Metadata = {
  title: 'Edit Profile | Wild 'n Out',
  description: 'Edit your Wild 'n Out profile and preferences',
};

export default async function ProfileEditPage() {
  // Get current user from Clerk
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  // Fetch user profile from our API
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/profile`, {
    headers: {
      Authorization: `Bearer ${process.env.API_SECRET}`,
      'x-user-id': user.id,
    },
    next: { revalidate: 60 }, // Revalidate every minute
  });
  
  if (!response.ok) {
    // If profile doesn't exist yet, redirect to onboarding
    if (response.status === 404) {
      redirect('/onboarding');
    }
    
    throw new Error('Failed to fetch profile');
  }
  
  const profileData = await response.json();
  const { profile } = profileData.data;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileEditor profile={profile} />
    </div>
  );
}
