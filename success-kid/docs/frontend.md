# Success Kid Community Platform
# Frontend Guidelines

## Table of Contents

1. [Strategic Foundation](#1-strategic-foundation)
   - [Business Impact Framework](#11-business-impact-framework)
   - [User Experience Principles](#12-user-experience-principles)
   - [Implementation Prioritization](#13-implementation-prioritization)
2. [Technology Stack](#2-technology-stack)
   - [Core Technologies](#21-core-technologies)
   - [Architectural Decisions](#22-architectural-decisions)
3. [Code Architecture & Organization](#3-code-architecture--organization)
   - [Project Structure](#31-project-structure)
   - [Naming Conventions](#32-naming-conventions)
   - [Component Hierarchy](#33-component-hierarchy)
   - [Component Composition Patterns](#34-component-composition-patterns)
4. [State Management](#4-state-management)
   - [State Classification Framework](#41-state-classification-framework)
   - [Implementation Patterns](#42-implementation-patterns)
5. [Styling & Design System](#5-styling--design-system)
   - [Token System](#51-token-system)
   - [Styling Patterns](#52-styling-patterns)
6. [Animation & Motion](#6-animation--motion)
   - [Animation Tokens](#61-animation-tokens)
   - [Key Animation Patterns](#62-key-animation-patterns)
7. [Performance Optimization](#7-performance-optimization)
   - [Performance Budget](#71-performance-budget)
   - [Optimization Techniques](#72-optimization-techniques)
8. [Accessibility Implementation](#8-accessibility-implementation)
   - [Requirements & Guidelines](#81-requirements--guidelines)
   - [Implementation Patterns](#82-implementation-patterns)
9. [Testing Strategy](#9-testing-strategy)
   - [Testing Coverage Framework](#91-testing-coverage-framework)
   - [Testing Patterns](#92-testing-patterns)
10. [Code Quality & Governance](#10-code-quality--governance)
    - [Enforcement Tools](#101-enforcement-tools)
    - [Contribution Process](#102-contribution-process)
11. [Anti-Pattern Catalog](#11-anti-pattern-catalog)
12. [Appendix: Implementation Patterns](#12-appendix-implementation-patterns)

---

## 1. Strategic Foundation

> **QUICK REFERENCE**
> - Align all frontend development with business objectives and metrics
> - Apply 5 UX principles: Determined Progress, Intuitive Accessibility, Community Visibility, Positive Reinforcement, Transparent Value
> - Prioritize implementation in 4 phases: Foundation, Component System, Features, Optimization

### 1.1 Business Impact Framework

Frontend development directly supports business objectives through these strategies:

| Business Objective | Frontend Strategy | Success Metrics |
|-------------------|-------------------|-----------------|
| **Increase user engagement** | Create intuitive interfaces with built-in reward mechanisms | 50+ daily contributions, 10+ min avg. session, 60%+ return rate |
| **Drive wallet connections** | Implement frictionless wallet integration with clear value proposition | 25%+ wallet connection rate |
| **Maximize points redemption** | Design transparent redemption flows with clear value exchange | 20%+ of eligible users redeeming weekly, 2,000+ avg points per redemption |
| **Build community visibility** | Highlight community activity with real-time feeds and leaderboards | 40%+ of users on leaderboards, 30%+ cross-user engagement |
| **Support mobile engagement** | Implement mobile-first responsive design with touch-optimized interfaces | Mobile session duration equal to desktop, 50%+ engagement from mobile |

### 1.2 User Experience Principles

Five core principles guide our UX decisions:

**1. Determined Progress**
- Definition: Make progress visible and rewarding, reflecting the Success Kid ethos
- Implementation: Progress indicators, achievement celebrations, milestone visualizations
- Impact: Directly supports retention goals and session duration metrics

**2. Intuitive Accessibility**
- Definition: Create interfaces understandable regardless of technical background
- Implementation: Progressive disclosure, contextual education, familiar patterns
- Impact: Broadens user base and reduces technical barriers to entry

**3. Community Visibility**
- Definition: Highlight community activity to create a sense of vibrant participation
- Implementation: Activity feeds, leaderboards, contribution recognition
- Impact: Drives content creation and community engagement

**4. Positive Reinforcement**
- Definition: Consistently reward and celebrate user engagement
- Implementation: Points animations, achievement celebrations, instant feedback
- Impact: Increases retention and repeat engagement

**5. Transparent Value**
- Definition: Clearly communicate value exchange at every interaction
- Implementation: Clear points values, conversion rates, market context
- Impact: Builds trust and supports redemption metrics

### 1.3 Implementation Prioritization

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|------------------|
| **1: Foundation** | Core structure, design tokens, linting | 4 weeks | Project setup, foundation components, Tailwind configuration |
| **2: Component System** | UI components, accessibility, documentation | 4 weeks | Complete component library, Storybook, WCAG compliance |
| **3: Features** | Application features, state management, APIs | 6 weeks | Feature implementation, state management, server integration |
| **4: Optimization** | Performance, animations, testing | 4 weeks | Performance optimization, animation enhancements, test coverage |

---

## 2. Technology Stack

> **QUICK REFERENCE**
> - Next.js 15.x (App Router) for application framework
> - React 19.x for UI library with Server Components
> - TypeScript 5.8+ for type safety
> - Tailwind CSS 4.0+ for styling with design tokens
> - Zustand for client state, React Query for server state
> - Vercel for deployment and edge functions

### 2.1 Core Technologies

| Technology | Version | Purpose | Selection Rationale |
|------------|---------|---------|---------------------|
| **Next.js** | 15.x+ | Application framework | Server components, App Router, edge functions, optimized for Vercel deployment |
| **React** | 19.x+ | UI library | Concurrent rendering, Server Components, component model, wide adoption |
| **TypeScript** | 5.8+ | Type safety | Reduce runtime errors, improve developer experience |
| **Tailwind CSS** | 4.0+ | Styling framework | Rapid development, consistent design, performance |
| **shadcn/ui** | 2.3+ | Component library | Accessible components, Tailwind integration |
| **Zustand** | 4.4+ | Client state management | Minimal boilerplate, performance-focused, simple API |
| **React Query** | 5.8+ | Server state management | Efficient data fetching, caching, server state management |
| **Framer Motion** | 12.x+ | Animation | Rich animation capabilities, performance-focused |
| **Clerk** | 5.x+ | Authentication | Multiple auth methods, security best practices |
| **React Hook Form** | 7.x+ | Form management | Performance optimized, validation integration |
| **Zod** | 3.x+ | Schema validation | TypeScript integration, runtime validation |
| **Sonner** | Latest | Toast notifications | Accessible, customizable, performance-optimized |

### 2.2 Architectural Decisions

| Decision | Approach | Rationale | Tradeoffs |
|----------|----------|-----------|-----------|
| **Server vs Client Components** | Default to Server Components, use Client Components only for interactivity | Optimizes performance by reducing JS sent to client while maintaining rich interactivity | More complex component organization; constraints on composition patterns |
| **Rendering Strategy** | Static generation for non-personalized content, dynamic rendering for user-specific content | Balances performance with personalization needs | More complex rendering lifecycle; careful data access patterns |
| **State Management** | Zustand for client state, React Query for server state, Context for theme/auth | Right tool for each job; optimizes for performance and developer experience | Multiple patterns to learn; potential complexity |
| **Styling Architecture** | Tailwind CSS with component abstractions and design tokens | Rapid development with consistent design system implementation | HTML can become verbose with utility classes; learning curve |
| **Mobile Implementation** | Mobile-first development with responsive design | Growing mobile usage; performance constraints drive better solutions | May require additional work for optimal desktop experiences |
| **Data Mutations** | Server Actions for form submissions and data mutations | Align with React's future direction; progressive enhancement; security benefits | New paradigm for team to learn; potential ecosystem limitations |
| **Edge Computing** | Edge functions for location-specific features and global performance | Reduced latency for users worldwide; better regional compliance | More complex deployment; careful state management |

---

## 3. Code Architecture & Organization

> **QUICK REFERENCE**
> - Follow monorepo structure with feature-based organization
> - Use consistent naming conventions (PascalCase for components, camelCase for hooks/utils)
> - Implement 5-level component hierarchy from foundation to pages
> - Apply composition patterns (children props, hooks for logic extraction)

### 3.1 Project Structure

```
success-kid-platform/
├── apps/                      # Application packages
│   ├── frontend/              # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/           # Next.js App Router
│   │   │   │   ├── (auth)/    # Authentication route group
│   │   │   │   ├── (marketing)/ # Public route group
│   │   │   │   ├── (platform)/ # Authenticated route group
│   │   │   │   │   ├── community/     # Community pages
│   │   │   │   │   ├── create/        # Content creation pages
│   │   │   │   │   ├── market/        # Market data pages
│   │   │   │   │   ├── profile/       # Profile pages
│   │   │   │   │   └── rewards/       # Rewards pages
│   │   │   ├── components/    # React components
│   │   │   │   ├── ui/        # Generic UI components
│   │   │   │   ├── features/  # Feature-specific components
│   │   │   │   ├── layout/    # Layout components
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── lib/           # Utility functions
│   │   │   ├── store/         # State management
│   │   │   └── types/         # TypeScript types
│   └── backend/               # Backend API service
├── packages/                  # Shared libraries
│   ├── ui/                    # Shared UI components
│   ├── config/                # Shared configuration
│   └── utils/                 # Common utilities
```

### 3.2 Naming Conventions

| Category | Convention | Examples | Notes |
|----------|------------|----------|-------|
| **Files** | PascalCase for components, camelCase for utilities | `Button.tsx`, `usePoints.ts` | Use `.tsx` for components, `.ts` for non-JSX |
| **Components** | PascalCase | `UserProfile`, `ButtonGroup` | Match file name to component name |
| **Props** | PascalCase with Component + Props | `ButtonProps`, `CardProps` | Define using TypeScript interfaces |
| **Hooks** | camelCase with `use` prefix | `usePoints`, `useWalletConnection` | Return values should be descriptive objects |
| **Functions** | camelCase with verb for actions | `fetchUserData`, `calculateRewards` | Use descriptive verbs that indicate purpose |
| **CSS** | Tailwind classes, kebab-case for custom | `bg-primary-500 text-white`, `points-display` | Prefer Tailwind classes over custom CSS |

### 3.3 Component Hierarchy

1. **Foundation Components** (Atoms)
   - Basic UI elements with no business logic (Button, Input, Card)
   - Highly reusable across the entire application
   - Located in `components/ui` directory

2. **Composite Components** (Molecules)
   - Combinations of foundation components (FormField, UserCard)
   - Encapsulate common UI patterns
   - Located in `components/features` directory

3. **Feature Components** (Organisms)
   - Implement specific business features (PointsRedemptionForm)
   - Combine multiple composite components
   - Located in feature-specific directories

4. **Layout Components**
   - Structure and organize other components (DashboardLayout)
   - Handle responsive behavior and positioning
   - Located in `components/layout` directory

5. **Page Components**
   - Top-level components for complete views
   - Compose feature components into complete pages
   - Located in appropriate route directories

### 3.4 Component Composition Patterns

**Server Component with Client Interactions**

```tsx
// Server component for data fetching
import { PointsClientView } from './points-client-view';

async function PointsSection({ userId }) {
  // Fetch data on the server
  const pointsData = await fetchPointsData(userId);
  const trends = await calculateTrends(pointsData);
  
  // Pass data to client component for interactivity
  return <PointsClientView initialData={pointsData} trends={trends} />;
}

// Client component for interactivity
'use client';
import { useState } from 'react';

function PointsClientView({ initialData, trends }) {
  const [activeView, setActiveView] = useState('daily');
  
  // Handle user interactions
  return (
    <div>
      <PointsDisplay data={initialData} />
      <PointsViewSelector active={activeView} onChange={setActiveView} />
      <PointsTrendChart data={trends[activeView]} />
    </div>
  );
}
```

**Component Composition with Children**

```tsx
// Flexible component composition
const Card = ({ children }) => <div className="card">{children}</div>;
Card.Header = ({ children }) => <div className="card-header">{children}</div>;
Card.Content = ({ children }) => <div className="card-content">{children}</div>;
Card.Footer = ({ children }) => <div className="card-footer">{children}</div>;

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Content>Content here</Card.Content>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>
```

**Custom Hooks for Logic Extraction**

```tsx
// Separate logic from presentation
function usePointsBalance(userId) {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Data fetching logic
  }, [userId]);
  
  return { balance, isLoading };
}

// Usage in component
function PointsDisplay({ userId }) {
  const { balance, isLoading } = usePointsBalance(userId);
  
  if (isLoading) return <PointsSkeleton />;
  return <PointsCounter value={balance} />;
}
```

**Server Actions for Form Submission**

```tsx
// Server action for form submission
'use server'

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const FormSchema = z.object({
  amount: z.number().positive(),
  source: z.string().min(1),
});

export async function awardPoints(formData: FormData) {
  // Validate input
  const validatedFields = FormSchema.safeParse({
    amount: Number(formData.get('amount')),
    source: formData.get('source'),
  });
  
  if (!validatedFields.success) {
    return { error: 'Invalid input' };
  }
  
  const { amount, source } = validatedFields.data;
  
  // Process points
  try {
    await db.points.create({
      data: {
        userId: 'current-user-id', // Replace with actual user ID
        amount,
        source,
      },
    });
    
    // Revalidate cache
    revalidatePath('/rewards');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to award points' };
  }
}

// Usage in client component
'use client'

import { useFormStatus } from 'react-dom';
import { awardPoints } from './actions';

function PointsForm() {
  const { pending } = useFormStatus();
  
  return (
    <form action={awardPoints}>
      <input type="number" name="amount" />
      <input type="text" name="source" />
      <button type="submit" disabled={pending}>
        {pending ? 'Awarding Points...' : 'Award Points'}
      </button>
    </form>
  );
}
```

**Component Documentation Standard**

```tsx
/**
 * @name ComponentName
 * @description Brief description of component purpose
 * @businessValue How this component supports business objectives
 * 
 * @props
 * - propName (type): description
 * 
 * @accessibility
 * - Key accessibility considerations
 * 
 * @example
 * <ComponentName prop="value" />
 */
```

---

## 4. State Management

> **QUICK REFERENCE**
> - Classify state into 5 types: UI, Feature, Shared, Server, and URL
> - Use Zustand for client state, React Query for server state
> - Use Server Actions for data mutations
> - Follow the state management decision tree to choose appropriate storage
> - Avoid common anti-patterns like state duplication and prop drilling

### 4.1 State Classification Framework

| State Type | Definition | Storage Method | Examples |
|------------|------------|----------------|----------|
| **UI State** | Visual/interaction state, no business logic impact | Local (useState/useReducer) | Modal open/closed, form field values, accordion expansion |
| **Feature State** | State specific to a single feature | Feature store (Zustand slice) | Current step in multi-step flow, feature-specific filters |
| **Shared State** | State needed across multiple features | Global store (Zustand) | Current user profile, points balance, notifications |
| **Server State** | Data from backend requiring caching/syncing | React Query | User data, content feeds, leaderboards |
| **URL State** | State that should be shareable via URL | URL parameters | Current tab, filters, search queries |

**State Management Decision Tree**

1. Is the state URL-addressable? → Use URL parameters
2. Is the state only used by a single component? → Use React's useState/useReducer
3. Is the state server data that needs caching/synchronization? → Use React Query
4. Is the state needed across multiple features? → Use global Zustand store
5. Otherwise → Use feature-specific Zustand slice

### 4.2 Implementation Patterns

**Client State with Zustand**

```tsx
// store/usePointsStore.ts
import { create } from 'zustand';

interface PointsState {
  balance: number;
  transactions: Transaction[];
  isLoading: boolean;
  
  // Actions
  addPoints: (amount: number, source: string) => void;
  fetchBalance: () => Promise<void>;
}

export const usePointsStore = create<PointsState>((set) => ({
  balance: 0,
  transactions: [],
  isLoading: false,
  
  addPoints: (amount, source) => {
    // Optimistic update
    set(state => ({
      balance: state.balance + amount,
      transactions: [
        { id: Date.now().toString(), amount, source, timestamp: new Date() },
        ...state.transactions
      ]
    }));
    
    // API call to persist via Server Action
    addPointsAction({ amount, source })
      .catch(error => {
        // Revert on error
        set(state => ({ 
          balance: state.balance - amount, 
          transactions: state.transactions.slice(1) 
        }));
      });
  },
  
  fetchBalance: async () => {
    set({ isLoading: true });
    try {
      const data = await fetchBalanceAction();
      set({ 
        balance: data.balance, 
        transactions: data.transactions, 
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
    }
  }
}));
```

**Server State with React Query**

```tsx
// hooks/useLeaderboard.ts
import { useQuery } from '@tanstack/react-query';

export function useLeaderboard(filters) {
  return useQuery({
    queryKey: ['leaderboard', filters],
    queryFn: async () => {
      // Server component data fetching approach
      const data = await fetch(`/api/leaderboard?${new URLSearchParams(filters)}`);
      if (!data.ok) throw new Error('Failed to fetch leaderboard');
      return data.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**Anti-patterns to Avoid**

1. **State Duplication**: Storing the same data in multiple places
   - Solution: Identify a single source of truth for each piece of state

2. **Prop Drilling**: Passing state through many layers of components
   - Solution: Use context or global state for widely-used state

3. **Over-global State**: Putting everything in global state when it's only used locally
   - Solution: Keep state as close as possible to where it's used

4. **Direct API Calls in Components**: Mixing UI rendering with data fetching
   - Solution: Use React Query or Server Components to separate concerns

5. **Synchronous Updates for Asynchronous Operations**: Not handling loading/error states
   - Solution: Always track loading/error states for async operations

---

## 5. Styling & Design System

> **QUICK REFERENCE**
> - Implement design tokens through Tailwind configuration
> - Follow Tailwind CSS with component abstractions methodology
> - Use CSS-in-TS approach with cva for component variants
> - Maintain consistent colors, spacing, typography across components

### 5.1 Token System

**Colors**
```typescript
// Representative example of color tokens
const colors = {
  primary: {
    DEFAULT: '#1E88E5', // Victory Blue
    50: '#E3F2FD',
    100: '#BBDEFB',
    900: '#0D47A1',
  },
  secondary: {
    DEFAULT: '#FFC107', // Sand Gold
  },
  accent: {
    DEFAULT: '#4CAF50', // Success Green
  },
  alert: {
    DEFAULT: '#F44336', // Action Red
  },
}
```

**Typography**
```typescript
// Typography scale
const typography = {
  fontFamily: {
    display: ['Montserrat', 'sans-serif'],
    body: ['Inter', 'sans-serif'],
    mono: ['Roboto Mono', 'monospace'],
    accent: ['Rubik', 'sans-serif'],
  },
  fontSize: {
    'display-lg': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
    'display-md': ['28px', { lineHeight: '1.3', fontWeight: '700' }],
    heading: ['20px', { lineHeight: '1.4', fontWeight: '600' }],
    body: ['14px', { lineHeight: '1.6', fontWeight: '400' }],
    small: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
  },
}
```

**Spacing**
```typescript
// Spacing scale
const spacing = {
  '2xs': '4px',   // 0.25rem
  xs: '8px',      // 0.5rem
  sm: '12px',     // 0.75rem
  md: '16px',     // 1rem
  lg: '24px',     // 1.5rem
  xl: '32px',     // 2rem
  '2xl': '48px',  // 3rem
}
```

**Breakpoints**
```typescript
// Responsive breakpoints
const screens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}
```

### 5.2 Styling Patterns

**Component Abstraction with Tailwind**

```tsx
// components/ui/Button.tsx
import { ButtonHTMLAttributes } from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-600",
        secondary: "bg-secondary text-black hover:bg-secondary-600",
        outline: "border border-neutral-200 bg-transparent hover:bg-neutral-100",
        ghost: "bg-transparent hover:bg-neutral-100",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps extends 
  ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export function Button({
  children,
  variant,
  size,
  className,
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
          {/* Loading icon */}
        </svg>
      )}
      {children}
    </button>
  );
}
```

**Dynamic Styling with CSS Variables**

```tsx
// components/ui/ProgressBar.tsx
export function ProgressBar({ 
  value, 
  max = 100, 
  color = 'primary'
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  // Map color option to CSS variable
  const colorMap = {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    accent: 'var(--color-accent)',
  };
  
  return (
    <div className="w-full">
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: colorMap[color] || colorMap.primary,
          }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      <div className="mt-1 text-sm text-neutral-600">
        {value} / {max}
      </div>
    </div>
  );
}
```

---

## 6. Animation & Motion

> **QUICK REFERENCE**
> - Use animation tokens for consistent timing and easing
> - Implement accessible animations that respect user preferences
> - Focus on purposeful animation that enhances user experience
> - Apply performance optimizations for smooth animations

### 6.1 Animation Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `duration-xs` | 100ms | Micro-interactions (button press) |
| `duration-sm` | 200ms | Simple transitions (opacity, color) |
| `duration-md` | 300ms | Standard transitions (modals, pages) |
| `duration-lg` | 500ms | Complex transitions (page transitions) |
| `duration-xl` | 800ms | Celebrations (achievements, milestones) |
| `ease-standard` | cubic-bezier(0.4, 0.0, 0.2, 1) | Standard easing for transitions |
| `ease-enter` | cubic-bezier(0.0, 0.0, 0.2, 1) | Easing for elements entering screen |
| `ease-exit` | cubic-bezier(0.4, 0.0, 1, 1) | Easing for elements exiting screen |
| `ease-emphatic` | cubic-bezier(0.2, 0.9, 0.3, 1.3) | Slight overshooting for emphasis |

### 6.2 Key Animation Patterns

**Feedback Animation**

```tsx
// Button press feedback
import { motion } from 'framer-motion';

export const FeedbackButton = ({ children, onClick }) => {
  return (
    <motion.button
      className="bg-primary text-white rounded-md px-4 py-2"
      whileTap={{ scale: 0.95 }} // Slight scale down on press
      whileHover={{ scale: 1.05 }} // Slight scale up on hover
      transition={{ duration: 0.1 }} // Quick feedback
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};
```

**Achievement Celebration**

```tsx
// Achievement unlock animation
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export const AchievementUnlock = ({ achievement, isVisible, onClose }) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-4 right-4 bg-secondary p-4 rounded-lg shadow-lg z-50"
          initial={prefersReducedMotion ? 
            { opacity: 0 } : 
            { opacity: 0, y: 50, scale: 0.3 }
          }
          animate={prefersReducedMotion ? 
            { opacity: 1 } : 
            { opacity: 1, y: 0, scale: 1 }
          }
          exit={prefersReducedMotion ? 
            { opacity: 0 } : 
            { opacity: 0, y: 20, scale: 0.5 }
          }
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 15
          }}
        >
          <div className="flex items-center">
            {/* Achievement content */}
            <button onClick={onClose}>&times;</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

**Accessibility Considerations**

```tsx
// hook for reduced motion preference
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', listener);
    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, []);
  
  return prefersReducedMotion;
}
```

**Performance Best Practices**

- Animate only `transform` and `opacity` properties when possible
- Use `will-change` property sparingly and only when needed
- Implement `@media (prefers-reduced-motion)` for accessibility
- Use hardware acceleration for complex animations with `translate3d`
- Minimize the number of animated elements on screen simultaneously
- Test animations on low-end devices to ensure performance

---

## 7. Performance Optimization

> **QUICK REFERENCE**
> - Meet or exceed Web Vitals targets (LCP < 2.5s, CLS < 0.1, etc.)
> - Use Server Components for data-heavy UI
> - Implement code splitting and lazy loading
> - Optimize images with Next.js Image component
> - Memorize expensive components and calculations
> - Leverage edge functions for global performance

### 7.1 Performance Budget

| Metric | Target | Measurement Tool |
|--------|--------|------------------|
| First Contentful Paint (FCP) | < 1.8s | Lighthouse, Web Vitals |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse, Web Vitals |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse, Web Vitals |
| First Input Delay (FID) | < 100ms | Web Vitals |
| Interaction to Next Paint (INP) | < 200ms | Web Vitals |
| Initial JavaScript Size | < 150KB (compressed) | Webpack Bundle Analyzer |
| Time To Interactive (TTI) | < 3.5s | Lighthouse |

### 7.2 Optimization Techniques

**Server Components for Reduced JavaScript**
- Use React Server Components for content-heavy pages
- Move data fetching to the server where possible
- Keep large data sets on the server

**Edge Computing**
- Deploy computation to edge locations with edge functions
- Use edge middleware for location-specific features
- Optimize response time with regional data centers

**Code Splitting and Lazy Loading**
- Use Next.js's built-in code splitting for routes
- Implement dynamic imports for large components
- Lazy load below-the-fold content
- Defer non-critical third-party scripts

**Image Optimization**
- Use Next.js Image component for automatic optimization
- Implement responsive images with appropriate sizes
- Apply lazy loading for below-the-fold images
- Use modern formats (WebP, AVIF) with fallbacks

**Rendering Optimization**
- Memoize expensive components with React.memo
- Use React.useCallback for event handlers in loops
- Apply React.useMemo for expensive calculations
- Implement virtualization for long lists (react-window)

**Optimized vs. Unoptimized List Rendering**

```tsx
// GOOD: Optimized list rendering
import { memo, useCallback } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';

// Extracted item component with memoization
const UserItem = memo(({ user, onFollow }) => {
  return (
    <div className="p-4 border-b">
      <Image 
        src={user.avatar} 
        alt={`${user.name}'s avatar`} 
        width={50} 
        height={50} 
        loading="lazy"
      />
      <h3>{user.name}</h3>
      <p>{user.bio}</p>
      <button onClick={() => onFollow(user.id)}>
        Follow
      </button>
    </div>
  );
});

// Main component with optimizations
const UserList = ({ users }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });
  
  // Memoized callback
  const handleFollow = useCallback((userId) => {
    console.log(`Follow ${userId}`);
  }, []);
  
  // Only render a subset initially, then more when scrolled into view
  const visibleUsers = inView ? users : users.slice(0, 10);
  
  return (
    <div ref={ref}>
      {visibleUsers.map(user => (
        <UserItem 
          key={user.id} 
          user={user} 
          onFollow={handleFollow} 
        />
      ))}
    </div>
  );
};
```

**CDN and Edge Caching Strategy**
- Implement CDN caching for static assets
- Use edge caching for semi-dynamic content
- Set appropriate cache-control headers
- Implement stale-while-revalidate patterns

---

## 8. Accessibility Implementation

> **QUICK REFERENCE**
> - Target WCAG 2.1 Level AA compliance for all features
> - Implement keyboard navigation for all interactive elements
> - Ensure proper screen reader support and semantics
> - Respect user preferences (reduced motion, color contrast, etc.)
> - Test with diverse assistive technologies

### 8.1 Requirements & Guidelines

**Non-negotiable Requirements**

1. **Keyboard Navigation**: All interactive elements must be accessible via keyboard
2. **Screen Reader Support**: All content must be accessible to screen readers
3. **Color Contrast**: Text must have a minimum contrast ratio of 4.5:1 (3:1 for large text)
4. **Text Resizing**: Interface must be usable when text is resized up to 200%
5. **Focus Indicators**: Visible focus indicators for all interactive elements
6. **Alternative Text**: All meaningful images must have appropriate alt text
7. **Form Labels**: All form controls must have properly associated labels
8. **Error Identification**: Form errors must be clearly identified and described
9. **Motion Control**: Animation must respect prefers-reduced-motion settings
10. **Page Structure**: Proper heading hierarchy and landmark regions

**Testing Methodology**

- Automated testing with axe-core in development and CI/CD
- Keyboard navigation testing for all user flows
- Screen reader testing with NVDA, JAWS, and VoiceOver
- Manual testing with assistive technologies
- Regular accessibility audits and remediation

### 8.2 Implementation Patterns

**Accessible Modal Dialog**

```tsx
// Accessible modal pattern (condensed)
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { FocusTrap } from '@headlessui/react';

export function Modal({ isOpen, onClose, title, children }) {
  const previousFocusRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement;
      
      // Handle escape key
      const handleEscapeKey = (e) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscapeKey);
      
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
        document.body.style.overflow = '';
        
        // Restore focus
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return createPortal(
    <FocusTrap>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50"
          aria-hidden="true"
          onClick={onClose}
        />
        
        {/* Modal content */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="relative bg-white rounded-lg p-6 shadow-xl"
        >
          <h2 id="modal-title" className="text-xl font-semibold mb-4">
            {title}
          </h2>
          <div>{children}</div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
      </div>
    </FocusTrap>,
    document.body
  );
}
```

**Accessible Form Field**

```tsx
// Accessible form field (condensed)
import { forwardRef, useId } from 'react';

export const FormField = forwardRef(
  ({ label, error, hint, id, required, ...props }, ref) => {
    // Generate a unique ID if one isn't provided
    const uniqueId = useId();
    const fieldId = id || `field-${uniqueId}`;
    const hintId = hint ? `hint-${fieldId}` : undefined;
    const errorId = error ? `error-${fieldId}` : undefined;
    
    return (
      <div>
        <label htmlFor={fieldId}>
          {label}
          {required && <span aria-hidden="true" className="text-alert ml-1">*</span>}
        </label>
        
        {hint && (
          <p id={hintId} className="text-sm text-neutral-500">
            {hint}
          </p>
        )}
        
        <input
          id={fieldId}
          ref={ref}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          required={required}
          {...props}
        />
        
        {error && (
          <p id={errorId} className="text-sm text-alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
```

---

## 9. Testing Strategy

> **QUICK REFERENCE**
> - Implement testing pyramid with clear coverage targets
> - Use Vitest and React Testing Library for component and unit tests
> - Apply accessibility testing in all test suites
> - Organize tests by developer workflow rather than test type
> - Create standardized testing patterns for consistency

### 9.1 Testing Coverage Framework

| Test Type | Coverage Target | Tools | When to Run |
|-----------|-----------------|-------|------------|
| **Unit Tests** | 80%+ of utility functions and hooks | Vitest, React Testing Library | On every code change, in CI |
| **Component Tests** | 70%+ of UI components | Vitest, React Testing Library | On component changes, in CI |
| **Integration Tests** | 60%+ of key user flows | Vitest, React Testing Library | On feature changes, in CI |
| **E2E Tests** | 40%+ of critical user journeys | Playwright | On major changes, daily in CI |
| **Visual Regression** | 50%+ of key UI components | Chromatic, Storybook | On UI changes, in CI |
| **Accessibility Tests** | 90%+ of all components | axe-core, Lighthouse | On every PR, in CI |

### 9.2 Testing Patterns

**Component Testing Pattern**

```tsx
// Component test pattern
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
    expect(button).not.toBeDisabled();
  });
  
  it('shows loading state when isLoading is true', () => {
    render(<Button isLoading>Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
  
  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**Hook Testing Pattern**

```tsx
// Hook test pattern
import { renderHook, act } from '@testing-library/react-hooks';
import { usePoints } from './usePoints';

// Mock dependencies
vi.mock('@/store/usePointsStore');

describe('usePoints', () => {
  beforeEach(() => {
    // Setup default mock implementation
  });
  
  it('returns current points balance and loading state', () => {
    const { result } = renderHook(() => usePoints());
    
    expect(result.current.balance).toBe(1000);
    expect(result.current.isLoading).toBe(false);
  });
  
  it('adds points and returns updated balance', async () => {
    const addPointsMock = vi.fn();
    // Setup mock
    
    const { result } = renderHook(() => usePoints());
    
    act(() => {
      result.current.addPoints(100, 'test');
    });
    
    expect(addPointsMock).toHaveBeenCalledWith(100, 'test');
  });
});
```

**Integration Testing Pattern**

```tsx
// Integration test pattern
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PointsRedemptionForm } from './PointsRedemptionForm';

// Mock dependencies
vi.mock('@/store/usePointsStore');
vi.mock('@/hooks/useWallet');

describe('PointsRedemptionForm', () => {
  beforeEach(() => {
    // Setup default mock implementations
  });
  
  it('allows users to redeem points for tokens', async () => {
    const redeemMock = vi.fn().mockResolvedValue({ success: true });
    // Setup mock
    
    render(<PointsRedemptionForm />);
    
    // Enter redemption amount
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '2000' },
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /redeem/i }));
    
    // Verify
    expect(redeemMock).toHaveBeenCalledWith(2000);
    
    await waitFor(() => {
      expect(screen.getByText(/successful/i)).toBeInTheDocument();
    });
  });
});
```

**Test Documentation Template**

```typescript
/**
 * @testName [Component/Feature] - [Functionality Being Tested]
 * @description What aspect is being tested and why
 * 
 * @setup
 * - Preconditions or setup needed
 * - Mock data or dependencies
 * 
 * @steps
 * 1. First step in the test scenario
 * 2. Second step in the test scenario
 * 
 * @expected
 * - What should happen when the test runs successfully
 * 
 * @edgeCases
 * - Edge cases this test addresses
 */
```

---

## 10. Code Quality & Governance

> **QUICK REFERENCE**
> - Use consistent linting and formatting with ESLint and Prettier
> - Follow clear contribution process from issue to deployment
> - Apply code review checklist for all PRs
> - Maintain documentation alongside code changes

### 10.1 Enforcement Tools

**ESLint Configuration (Key Rules)**

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:jsx-a11y/recommended",
    "plugin:tailwindcss/recommended"
  ],
  "plugins": ["jsx-a11y", "tailwindcss"],
  "rules": {
    "react-hooks/exhaustive-deps": "warn",
    "tailwindcss/no-custom-classname": "warn"
  }
}
```

**Prettier Configuration**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Commit Hooks**

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### 10.2 Contribution Process

1. **Feature Request / Bug Report**
   - Create issue with clear description and business justification
   - Add relevant labels (component, feature, bug, etc.)
   - Assign priority based on business impact

2. **Design Review**
   - For UI components, create design proposal
   - Review against design system and guidelines
   - Get approval from design team

3. **Implementation Plan**
   - Create implementation plan with technical approach
   - Identify affected components and potential risks
   - Define acceptance criteria and testing approach

4. **Development**
   - Create branch from main with descriptive name
   - Follow coding standards and guidelines
   - Write tests for all new functionality
   - Document code and update component documentation

5. **Code Review**
   - Submit PR with clear description
   - Assign reviewers from relevant teams
   - Address review comments
   - Ensure all checks pass (linting, tests, build)

6. **Testing and Quality Assurance**
   - Verify functionality meets acceptance criteria
   - Perform accessibility testing
   - Ensure responsive behavior
   - Check performance impact

7. **Documentation and Release**
   - Update documentation if needed
   - Add to changelog
   - Merge to main
   - Deploy according to release process

**Frontend PR Review Checklist**

- Code meets style guidelines and passes linting
- Component correctly implements design specs
- Tests cover functionality and edge cases
- Accessibility requirements are met
- Performance considerations addressed
- Documentation is updated

---

## 11. Anti-Pattern Catalog

> **QUICK REFERENCE**
> - Avoid component bloat by focusing components on single responsibilities
> - Prevent prop drilling by using context or state management
> - Don't manipulate DOM directly; use React's declarative approach
> - Keep components pure and avoid side effects in render functions
> - Maintain consistent styling patterns

| Anti-Pattern | Description | Why It's Harmful | Correct Approach |
|--------------|-------------|------------------|------------------|
| **Component Bloat** | Components with too many props and responsibilities | - Hard to test<br>- Violates separation of concerns<br>- Duplicates code across endpoints | Split into smaller, focused components with clear responsibilities |
| **Prop Drilling** | Passing props through many component layers | - Breaks abstraction<br>- Makes testing difficult<br>- Complicates transaction management | Use Context for widely shared state, composition patterns |
| **Direct DOM Manipulation** | Bypassing React's declarative model with direct DOM access | - Creates slow responses<br>- Leads to timeout issues<br>- Affects scalability | Use refs properly, embrace declarative patterns |
| **Style Inconsistency** | Mixing multiple styling approaches | - Hard to understand<br>- Difficult to test<br>- Mixes concerns | Standardize on Tailwind, use design tokens |
| **Premature Optimization** | Optimizing code before measuring performance | - Results in cryptic errors<br>- May expose sensitive information<br>- Creates inconsistent user experience | Measure first, optimize what's proven to be a bottleneck |

### Before & After Example: Component Bloat

❌ **INCORRECT**:
```tsx
// Anti-pattern: Bloated component with many responsibilities
const UserProfileCard = ({ 
  user, 
  onFollow, 
  onMessage, 
  expanded,
  toggleExpanded,
  showStats,
  // Many more props...
}) => {
  // Complex component mixing many concerns
  return (
    <div className="user-card">
      <div className="user-header">
        <img src={user.avatar} alt={user.name} />
        <h3>{user.name}</h3>
      </div>
      
      {expanded && (
        <div className="user-details">
          <p>{user.bio}</p>
          {showStats && (/* Stats rendering */)}
        </div>
      )}
      
      <div className="user-actions">
        <button onClick={() => onFollow(user.id)}>
          {user.isFollowing ? 'Unfollow' : 'Follow'}
        </button>
        <button onClick={toggleExpanded}>
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      </div>
    </div>
  );
};
```

✅ **CORRECT**:
```tsx
// Pattern: Split into focused components
// UserAvatar component
const UserAvatar = ({ user }) => (
  <Image 
    src={user.avatar} 
    alt={`${user.name}'s avatar`}
    width={64}
    height={64}
    className="rounded-full"
  />
);

// UserStats component
const UserStats = ({ followers, following, posts }) => (
  <div className="user-stats">
    <span>{followers} followers</span>
    <span>{following} following</span>
    <span>{posts} posts</span>
  </div>
);

// Main UserCard with reduced complexity
const UserCard = ({ user, onFollow }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card>
      <Card.Header>
        <UserAvatar user={user} />
        <h3>{user.name}</h3>
      </Card.Header>
      
      <Card.Content>
        {expanded ? (
          <p>{user.bio}</p>
        ) : (
          <p>{user.bio.substring(0, 100)}...</p>
        )}
        
        {expanded && <UserStats {...user} />}
        
        <Button 
          variant="link" 
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show Less' : 'Show More'}
        </Button>
      </Card.Content>
      
      <Card.Footer>
        <Button 
          variant="primary" 
          onClick={() => onFollow(user.id)}
        >
          {user.isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
      </Card.Footer>
    </Card>
  );
};
```

---

## 12. Appendix: Implementation Patterns

This appendix contains full implementation examples for reference. Below is a table of contents for the patterns included:

- [Button Component Pattern](#button-component-pattern)
- [Form Field Pattern](#form-field-pattern)
- [Points Store Pattern](#points-store-pattern)
- [Server/Client Component Pattern](#serverclient-component-pattern)
- [Server Actions Pattern](#server-actions-pattern)
- [Wallet Connection Pattern](#wallet-connection-pattern)
- [Modal Dialog Pattern](#modal-dialog-pattern)
- [Animation Pattern](#animation-pattern)
- [List Rendering Pattern](#list-rendering-pattern)
- [Media Handling Pattern](#media-handling-pattern)

### Media Handling Pattern

```tsx
// Media upload with Vercel Blob Storage
'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import Image from 'next/image'
import { uploadToBlob } from '@/lib/blob'

export function MediaUploader({ onUploadComplete }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return
    
    // Reset states
    setError(null)
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please select an image file (JPG, PNG, GIF, WEBP)')
      return
    }
    
    // Validate file size
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }
    
    // Set file and create preview
    setFile(selectedFile)
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return
    
    try {
      setUploading(true)
      setError(null)
      
      // Upload to Vercel Blob
      const { url, blobId } = await uploadToBlob(file)
      
      // Notify parent component of successful upload
      onUploadComplete({
        url,
        blobId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      })
      
      // Reset states
      setFile(null)
      setPreview(null)
      
    } catch (err) {
      console.error('Upload failed:', err)
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors">
        <input
          type="file"
          className="hidden"
          id="media-upload"
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/gif,image/webp"
        />
        <label htmlFor="media-upload" className="cursor-pointer flex flex-col items-center">
          <Upload className="h-12 w-12 text-gray-400 mb-2" />
          <span className="text-sm font-medium text-gray-700">
            Drag and drop or click to upload
          </span>
          <span className="text-xs text-gray-500 mt-1">
            Maximum file size: 5MB
          </span>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-alert">{error}</div>
      )}

      {/* Preview */}
      {preview && (
        <div className="mt-4 relative">
          <div className="relative h-64 overflow-hidden rounded-lg">
            <Image
              src={preview}
              alt="Upload preview"
              fill
              className="object-contain"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        </div>
      )}

      {/* Upload Button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-2 px-4 bg-primary text-white rounded-md disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
      )}
    </div>
  )
}

// Server-side upload handler
'use server'

import { put } from '@vercel/blob'
import { nanoid } from 'nanoid'

export async function uploadToBlob(file) {
  try {
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `${nanoid()}.${fileExtension}`
    
    // Upload to Vercel Blob
    const { url, blobId } = await put(uniqueFilename, file, {
      access: 'public',
      contentType: file.type
    })
    
    return { url, blobId }
  } catch (error) {
    console.error('Blob upload error:', error)
    throw new Error('Failed to upload file')
  }
}
```

### Server Actions Pattern

```tsx
// Server action for form submission
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

// Validation schema
const PostFormSchema = z.object({
  title: z.string().min(3).max(100),
  content: z.string().min(10).max(5000),
  category: z.string().min(1)
})

// Form action
export async function createPost(formData) {
  // Get current user from auth
  const userId = cookies().get('userId')?.value
  if (!userId) {
    return { error: 'You must be logged in to create a post' }
  }
  
  // Validate form data
  const result = PostFormSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    category: formData.get('category')
  })
  
  if (!result.success) {
    return {
      error: 'Validation failed',
      fieldErrors: result.error.flatten().fieldErrors
    }
  }
  
  // Parse image if present
  let imageUrl = null
  const imageBlob = formData.get('imageBlob')
  if (imageBlob && typeof imageBlob === 'string') {
    try {
      const blobData = JSON.parse(imageBlob)
      imageUrl = blobData.url
    } catch (e) {
      console.error('Failed to parse image blob data', e)
    }
  }
  
  // Save to database
  try {
    const post = await db.post.create({
      data: {
        title: result.data.title,
        content: result.data.content,
        category: result.data.category,
        imageUrl,
        authorId: userId
      }
    })
    
    // Award points for post creation
    await db.points.create({
      data: {
        userId,
        amount: 50,
        source: 'post_creation',
        referenceId: post.id
      }
    })
    
    // Revalidate related pages
    revalidatePath('/community')
    revalidatePath(`/profile/${userId}`)
    
    return { success: true, postId: post.id }
  } catch (error) {
    console.error('Failed to create post', error)
    return { error: 'Failed to create post. Please try again.' }
  }
}

// Client component using server action
'use client'

import { useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createPost } from '@/app/actions'
import { MediaUploader } from '@/components/MediaUploader'

function CreatePostForm() {
  const [imageData, setImageData] = useState(null)
  const [errors, setErrors] = useState({})
  const formRef = useRef(null)
  const { pending } = useFormStatus()
  
  async function handleSubmit(formData) {
    // Add image data to form if available
    if (imageData) {
      formData.append('imageBlob', JSON.stringify(imageData))
    }
    
    // Submit form using server action
    const result = await createPost(formData)
    
    if (result.error) {
      setErrors(result.fieldErrors || { form: result.error })
      return
    }
    
    // Handle success
    formRef.current?.reset()
    setImageData(null)
    
    // Show success toast or redirect
  }
  
  return (
    <form action={handleSubmit} ref={formRef} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-alert">{errors.title}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="category" className="block text-sm font-medium">
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">Select a category</option>
          <option value="general">General Discussion</option>
          <option value="token">Token Talk</option>
          <option value="media">Memes & Media</option>
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-alert">{errors.category}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="content" className="block text-sm font-medium">
          Content
        </label>
        <textarea
          id="content"
          name="content"
          rows={5}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.content && (
          <p className="mt-1 text-sm text-alert">{errors.content}</p>
        )}
      </div>
      
      <div>
        <p className="block text-sm font-medium mb-2">Image (Optional)</p>
        <MediaUploader 
          onUploadComplete={setImageData} 
        />
      </div>
      
      {errors.form && (
        <div className="text-sm text-alert">{errors.form}</div>
      )}
      
      <div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {pending ? 'Creating Post...' : 'Create Post'}
        </button>
      </div>
    </form>
  )
}
```
