'use client';

import { UserButton as ClerkUserButton } from '@clerk/nextjs';

export function UserButton() {
  return (
    <ClerkUserButton
      afterSignOutUrl="/"
      appearance={{
        elements: {
          userButtonAvatarBox: "h-10 w-10",
          userButtonBox: "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full",
        },
      }}
    />
  );
}
