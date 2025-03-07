'use client';

import { UserButton as ClerkUserButton } from '@clerk/nextjs';

/**
 * User profile button for account management
 */
export function UserButton() {
  return (
    <ClerkUserButton
      appearance={{
        elements: {
          userButtonAvatarBox: 'w-10 h-10',
          userButtonPopoverCard: 'bg-zinc-900 border border-zinc-800 text-hype-white',
          userButtonPopoverActionButton: 'text-hype-white hover:bg-zinc-800',
          userButtonPopoverActionButtonIcon: 'text-zinc-400',
          userButtonPopoverFooter: 'border-t border-zinc-800',
        }
      }}
    />
  );
}
