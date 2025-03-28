'use client';

import React, { ReactNode } from 'react';
import { UserResource } from '@clerk/types';
import { ProfileProvider } from './profile-context';

interface ProfileWrapperProps {
  userId: string;
  user?: UserResource | null;
  isOwnProfile?: boolean;
  children: ReactNode;
}

export function ProfileWrapper({
  userId,
  user = null,
  isOwnProfile = false,
  children,
}: ProfileWrapperProps) {
  return (
    <ProfileProvider
      userId={userId}
      user={user}
      isOwnProfile={isOwnProfile}
    >
      {children}
    </ProfileProvider>
  );
}
