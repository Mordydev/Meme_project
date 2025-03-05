# Authentication with Clerk

This document outlines the authentication setup for the Success Kid Community Platform using Clerk and Supabase.

## Overview

The authentication system uses Clerk for user authentication and management, while syncing user data with Supabase for application-specific data storage and access control.

## Components

### Clerk Provider

The `ClerkProvider` component wraps the application and provides authentication context to all components.

```tsx
// src/components/providers/ClerkProvider.tsx
import { ClerkProvider as NextClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { ReactNode } from 'react';

export function ClerkProvider({ children }: { children: ReactNode }) {
  return (
    <NextClerkProvider appearance={{ baseTheme: dark, /* ... */ }}>
      {children}
    </NextClerkProvider>
  );
}
```

### Middleware

The middleware controls which routes require authentication and which are publicly accessible.

```tsx
// src/middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhook/clerk",
    "/categories(.*)",
    "/posts(.*)",
    "/market(.*)",
  ],
  
  authorizedRoutes: {
    admin: ["/admin(.*)"],
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### User Synchronization

When a user signs up or updates their profile in Clerk, the data is synchronized with Supabase through webhooks.

```tsx
// src/app/api/webhook/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ClerkUser, syncUserWithSupabase } from '@/lib/clerk';

export async function POST(req: Request) {
  // Webhook handling logic
  // ...
}
```

### Authentication Utilities

The `clerk.ts` file provides utilities for working with authenticated users and syncing data with Supabase.

```tsx
// src/lib/clerk.ts
import { supabase } from './supabase';

export interface ClerkUser {
  id: string;
  username?: string | null;
  // ...
}

export const syncUserWithSupabase = async (clerkUser: ClerkUser) => {
  // Sync logic
  // ...
};

export const isUserAdmin = async (userId: string) => {
  // Admin check logic
  // ...
};
```

## Authentication Flow

1. User signs up or signs in using Clerk
2. Clerk authenticates the user and creates a session
3. Webhook is triggered to sync user data with Supabase
4. User data is stored in Supabase for application-specific needs
5. Row Level Security in Supabase ensures users can only access their own data

## Sign-In and Sign-Up Pages

The platform provides dedicated pages for sign-in and sign-up:

- `/sign-in/[[...sign-in]]/page.tsx`: Sign-in page
- `/sign-up/[[...sign-up]]/page.tsx`: Sign-up page

## User Profile

The user profile page displays user information, achievements, and points:

- `/profile/page.tsx`: Profile page
- `/components/user/UserProfile.tsx`: User profile component

## Authentication UI Components

The `AuthButtons` component provides sign-in, sign-up, and user menu buttons:

```tsx
// src/components/layout/AuthButtons.tsx
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
// ...

export function AuthButtons() {
  const { isSignedIn, isLoaded } = useUser();
  // ...
}
```

## Environment Variables

The following environment variables are required for Clerk authentication:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
CLERK_WEBHOOK_SECRET=your-clerk-webhook-secret
```

## Setup Instructions

1. Create a Clerk account at https://clerk.dev
2. Create a new application in the Clerk dashboard
3. Configure the application settings (authentication methods, appearance, etc.)
4. Copy the API keys from the Clerk dashboard
5. Set the environment variables in your `.env.local` file
6. Configure the webhook endpoint in the Clerk dashboard to point to `/api/webhook/clerk` 