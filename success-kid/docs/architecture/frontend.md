# Frontend Architecture

This document outlines the architecture of the Success Kid Community Platform frontend application, built with Next.js and React.

## Core Architecture

The frontend is a Next.js application using the App Router, with React Server Components for data fetching and client components for interactivity.

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.2+ | Application framework with App Router |
| **React** | 19.1+ | UI library with Server Components |
| **TypeScript** | 5.4+ | Type safety |
| **Tailwind CSS** | 4.0+ | Styling framework |
| **Clerk** | 5.3+ | Authentication |
| **Zustand** | 4.4+ | State management |
| **React Query** | 5.8+ | Data fetching and caching |
| **Framer Motion** | 10.16+ | Animation |

### Project Structure

```
apps/frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Authentication route group
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration page
│   │   └── layout.tsx      # Auth layout
│   ├── (marketing)/        # Public marketing route group
│   │   ├── page.tsx        # Landing page
│   │   └── layout.tsx      # Marketing layout
│   ├── (platform)/         # Authenticated platform route group
│   │   ├── community/      # Community pages
│   │   ├── create/         # Content creation pages
│   │   ├── market/         # Market data pages
│   │   ├── profile/        # Profile pages
│   │   ├── rewards/        # Rewards pages
│   │   └── layout.tsx      # Platform layout
│   ├── api/                # API routes (limited usage)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Root page (redirects)
├── src/
│   ├── components/         # React components
│   │   ├── ui/             # Generic UI components
│   │   ├── features/       # Feature-specific components
│   │   └── layout/         # Layout components
│   ├── hooks/              # Custom React hooks
│   │   ├── use-points.ts   # Points-related hooks
│   │   └── use-wallet.ts   # Wallet-related hooks
│   ├── lib/                # Utility functions
│   │   ├── api.ts          # API client
│   │   └── formatting.ts   # Formatting utilities
│   ├── store/              # State management
│   │   ├── points-store.ts # Points-related state
│   │   └── wallet-store.ts # Wallet-related state
│   └── types/              # TypeScript types
├── public/                 # Static assets
└── middleware.ts           # Next.js middleware (auth)
```

## Key Architecture Decisions

### Server vs. Client Components

We follow a "server-first" approach, using Server Components by default for:
- Data fetching
- SEO-sensitive content
- Static/rarely changing UI

Client Components are used for:
- Interactive UI elements
- State-dependent rendering
- Event handlers and user interactions

Example pattern:
```tsx
// In a Server Component
import { ClientComponent } from '@/components/client-component';
import { fetchData } from '@/lib/data';

export default async function ServerComponent() {
  // Server-side data fetching
  const data = await fetchData();
  
  // Pass data to Client Component
  return <ClientComponent initialData={data} />;
}

// In a Client Component
'use client';

import { useState } from 'react';

export function ClientComponent({ initialData }) {
  const [data, setData] = useState(initialData);
  // Interactive behavior
  return <button onClick={() => setData(newValue)}>Update</button>;
}
```

### State Management

We use a combination of state management approaches:

1. **Local State**: React's `useState` for component-specific state
2. **Global State**: Zustand for application-wide state
3. **Server State**: React Query for API data caching and synchronization
4. **Form State**: React's form hooks for form state management

Example Zustand store:
```tsx
import { create } from 'zustand';

interface PointsState {
  balance: number;
  history: PointTransaction[];
  isLoading: boolean;
  
  fetchBalance: () => Promise<void>;
  addPoints: (amount: number, source: string) => Promise<void>;
}

export const usePointsStore = create<PointsState>((set) => ({
  balance: 0,
  history: [],
  isLoading: false,
  
  fetchBalance: async () => {
    set({ isLoading: true });
    try {
      const data = await fetchPointsBalance();
      set({ balance: data.balance, history: data.transactions, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch points balance', error);
      set({ isLoading: false });
    }
  },
  
  addPoints: async (amount, source) => {
    // Implementation
  }
}));
```

### Routing Strategy

We use the Next.js App Router with route groups to organize our application:

- `(auth)`: Authentication-related pages (login, register)
- `(marketing)`: Public-facing marketing pages
- `(platform)`: Authenticated platform experience

Route groups (using parentheses) don't affect URL structure but help with code organization and layouts.

### Authentication Flow

We use Clerk for authentication:

1. Authentication state is managed by Clerk and accessed via middleware
2. Protected routes redirect unauthenticated users to login
3. Server components retrieve authentication state using `auth()` function
4. Client components use `useAuth()` and `useUser()` hooks

### Styling Approach

We use Tailwind CSS with a consistent design system:

1. Custom theme extends Tailwind configuration
2. Design tokens are exposed as CSS variables
3. Component variants use CSS composition patterns
4. Mobile-first responsive design
5. Animations use Framer Motion for complex interactions

### API Integration

For data fetching, we follow these patterns:

1. Server Components fetch data directly using `fetch` with proper caching
2. Client Components use React Query for data fetching, caching, and synchronization
3. WebSocket is used for real-time updates
4. API client abstracts endpoint details and handle errors consistently

Example:
```tsx
// In a Server Component
export default async function UserProfile({ userId }) {
  const userData = await fetch(`/api/users/${userId}`, {
    next: { revalidate: 60 } // Revalidate every 60 seconds
  }).then(res => res.json());
  
  return <ProfileDisplay user={userData} />;
}

// In a Client Component
'use client';

import { useQuery } from '@tanstack/react-query';

export function ProfileActivity({ userId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['user-activity', userId],
    queryFn: () => fetch(`/api/users/${userId}/activity`).then(res => res.json()),
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  
  if (isLoading) return <ActivitySkeleton />;
  return <ActivityFeed activities={data} />;
}
```

## Performance Optimization

### Core Web Vitals Optimization

- Server Components for fast initial load
- Image optimization with Next.js Image component
- Font optimization with next/font
- Component-level code splitting
- Prefetching critical routes

### Render Optimization

- Memoize expensive calculations with useMemo
- Prevent unnecessary re-renders with useCallback
- Virtual lists for long scrollable content
- Optimistic UI updates for improved perceived performance

## Key UI Component Categories

| Category | Examples | Purpose |
|----------|----------|---------|
| **Foundation** | Typography, Colors, Spacing | Core design tokens |
| **Base UI** | Button, Input, Card | Generic interface elements |
| **Composite** | Form, Dropdown, Modal | Combined base components |
| **Feature** | PointsDisplay, WalletConnect | Feature-specific components |
| **Layout** | Container, Grid, Stack | Structure and organization |
| **Feedback** | Toast, Alert, Progress | User feedback elements |
| **Data Display** | Table, Chart, Badge | Displaying structured data |

## Related Documentation

- [Backend Architecture](./backend.md)
- [Component Library](http://localhost:6006) (Storybook)
- [Design System Documentation](../development/design-system.md)
