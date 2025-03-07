# Setting Up Clerk Authentication in Next.js

This guide provides instructions for setting up Clerk authentication in your Next.js application for the Wild 'n Out platform.

## Prerequisites

- Next.js 13+ with App Router
- Node.js 16+
- A Clerk account (free tier available at [clerk.com](https://clerk.com))

## Step 1: Create a Clerk Application

1. Sign up or log in to your Clerk account at [clerk.com](https://clerk.com)
2. Create a new application from the dashboard
3. Note the API keys (Publishable Key and Secret Key)

## Step 2: Install Clerk SDK

```bash
npm install @clerk/nextjs
```

## Step 3: Configure Environment Variables

Create or update your `.env.local` file in the root of your Next.js project:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

Replace the placeholders with your actual Clerk API keys.

## Step 4: Set Up Clerk Provider

The Clerk provider has already been configured in:
- `src/components/providers/clerk-provider.tsx`
- And integrated into the main provider component in `src/components/providers/index.tsx`

## Step 5: Add Authentication Middleware

The middleware file `middleware.ts` in the root of your Next.js project handles route protection.

This middleware verifies authentication for all routes except those specified in `publicRoutes` and `ignoredRoutes`.

## Step 6: Create Sign-In and Sign-Up Pages

The sign-in and sign-up pages are already implemented at:
- `/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- `/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`

These pages use Clerk's built-in UI components with custom styling to match the Wild 'n Out design system.

## Step 7: Access User Data in Components

You can access user data in client components using Clerk hooks:

```tsx
'use client'

import { useUser } from '@clerk/nextjs'

export function UserProfile() {
  const { user, isLoaded } = useUser()
  
  if (!isLoaded) {
    return <div>Loading...</div>
  }
  
  return <div>Hello, {user?.username}</div>
}
```

Or in server components using the currentUser helper:

```tsx
import { currentUser } from '@clerk/nextjs'

export default async function ProfilePage() {
  const user = await currentUser()
  
  if (!user) {
    return <div>Not logged in</div>
  }
  
  return <div>Hello, {user.username}</div>
}
```

## Step 8: Protecting Routes

You can protect routes either:

1. Using the middleware configuration (applied globally)
2. In individual components/pages by checking auth status:

```tsx
import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const user = await currentUser()
  
  // Redirect if not authenticated
  if (!user) {
    return redirect('/sign-in')
  }
  
  // Page content for authenticated users
  return <div>Protected content</div>
}
```

## Step 9: Add User Button to Navigation

The user button component in `src/components/features/authentication/user-button.tsx` has been added to the navigation bar, displaying a sign-in link for unauthenticated users and the user menu for authenticated users.

## Backend Integration

The backend is configured to use Clerk for JWT validation via the Fastify plugin. See:
- `apps/backend/src/plugins/clerk.ts`
- `apps/backend/src/middleware/auth/index.ts`

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
