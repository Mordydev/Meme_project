# Success Kid Community Platform
# Frontend Guidelines

## Table of Contents

1. [Strategic Foundation](#1-strategic-foundation)
   - [Business Impact Alignment](#11-business-impact-alignment)
   - [UX Principles](#12-ux-principles)
   - [Implementation Roadmap](#13-implementation-roadmap)
2. [Technology Architecture](#2-technology-architecture)
   - [Core Stack](#21-core-stack)
   - [Architectural Patterns](#22-architectural-patterns)
   - [Project Structure](#23-project-structure)
3. [Component System](#3-component-system)
   - [Component Hierarchy](#31-component-hierarchy)
   - [Composition Patterns](#32-composition-patterns)
   - [Naming Conventions](#33-naming-conventions)
4. [State Management](#4-state-management)
   - [State Classification](#41-state-classification)
   - [Implementation Patterns](#42-implementation-patterns)
5. [User Interface](#5-user-interface)
   - [Design Tokens](#51-design-tokens)
   - [Styling Approach](#52-styling-approach)
   - [Animation System](#53-animation-system)
6. [Performance & Accessibility](#6-performance--accessibility)
   - [Performance Targets](#61-performance-targets)
   - [Optimization Strategies](#62-optimization-strategies)
   - [Accessibility Requirements](#63-accessibility-requirements)
7. [Quality Assurance](#7-quality-assurance)
   - [Testing Strategy](#71-testing-strategy)
   - [Code Quality Tools](#72-code-quality-tools)
   - [Anti-Pattern Prevention](#73-anti-pattern-prevention)
8. [Implementation Patterns](#8-implementation-patterns)
   - [Server/Client Integration](#81-serverclient-integration)
   - [Data Mutation](#82-data-mutation)
   - [Media Management](#83-media-management)

---

## 1. Strategic Foundation

### 1.1 Business Impact Alignment

Frontend development directly supports business objectives through these strategies:

| Business Objective | Frontend Strategy | Success Metrics |
|-------------------|-------------------|-----------------|
| **Increase user engagement** | Create intuitive interfaces with built-in reward mechanisms | 50+ daily contributions, 10+ min avg. session, 60%+ return rate |
| **Drive wallet connections** | Implement frictionless wallet integration with clear value proposition | 25%+ wallet connection rate |
| **Maximize points redemption** | Design transparent redemption flows with clear value exchange | 20%+ of eligible users redeeming weekly |
| **Build community visibility** | Highlight community activity with real-time feeds and leaderboards | 40%+ of users on leaderboards, 30%+ cross-user engagement |
| **Support mobile engagement** | Implement mobile-first responsive design with touch-optimized interfaces | Mobile session duration equal to desktop, 50%+ mobile engagement |

### 1.2 UX Principles

Five core principles guide all UX decisions:

1. **Determined Progress**
   - Make progress visible and rewarding, reflecting the Success Kid ethos
   - Implement through progress indicators, achievement celebrations, and milestone visualizations
   - Directly supports retention goals and session duration metrics

2. **Intuitive Accessibility**
   - Create interfaces understandable regardless of technical background
   - Implement through progressive disclosure, contextual education, and familiar patterns
   - Broadens user base and reduces technical barriers to entry

3. **Community Visibility**
   - Highlight community activity to create a sense of vibrant participation
   - Implement through activity feeds, leaderboards, and contribution recognition
   - Drives content creation and community engagement

4. **Positive Reinforcement**
   - Consistently reward and celebrate user engagement
   - Implement through points animations, achievement celebrations, and instant feedback
   - Increases retention and repeat engagement

5. **Transparent Value**
   - Clearly communicate value exchange at every interaction
   - Implement through clear points values, conversion rates, and market context
   - Builds trust and supports redemption metrics

### 1.3 Implementation Roadmap

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|------------------|
| **1: Foundation** | Core structure, design tokens, linting | 4 weeks | Project setup, foundation components, Tailwind configuration |
| **2: Component System** | UI components, accessibility, documentation | 4 weeks | Complete component library, Storybook, WCAG compliance |
| **3: Features** | Application features, state management, APIs | 6 weeks | Feature implementation, state management, server integration |
| **4: Optimization** | Performance, animations, testing | 4 weeks | Performance optimization, animation enhancements, test coverage |

---

## 2. Technology Architecture

### 2.1 Core Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.x+ | Application framework with Server Components, App Router, edge functions |
| **React** | 19.x+ | UI library with concurrent rendering and Server Components |
| **TypeScript** | 5.8+ | Type safety and developer experience |
| **Tailwind CSS** | 4.0+ | Utility-first styling framework |
| **Zustand** | 4.4+ | Client state management |
| **React Query** | 5.8+ | Server state management |
| **Framer Motion** | 12.x+ | Animation library |
| **Clerk** | 5.x+ | Authentication |
| **Zod** | 3.x+ | Schema validation |
| **Vercel** | Latest | Deployment platform with edge functions |

### 2.2 Architectural Patterns

#### Server vs. Client Components

- **Default to Server Components** for:
  - Data fetching
  - Static content
  - SEO-critical sections
  - Layout components
  
- **Use Client Components only** for:
  - Interactive UI elements
  - Components using browser APIs
  - State-dependent interfaces
  - Real-time updates

#### Rendering Strategy

- **Static Generation** for non-personalized content
- **Dynamic Rendering** for user-specific content
- **Streaming** for large data sets
- **Edge Functions** for location-specific operations

#### State Management

- **URL State**: Route parameters, search queries
- **UI State**: Local component state (useState/useReducer)
- **Client State**: Zustand for global client state
- **Server State**: React Query for data fetching and caching
- **Server Actions**: For data mutations and form submissions

### 2.3 Project Structure

```
success-kid-platform/
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/                   # Next.js App Router
│   │   │   │   ├── (auth)/            # Authentication routes
│   │   │   │   ├── (marketing)/       # Public marketing routes
│   │   │   │   ├── (platform)/        # Authenticated app routes
│   │   │   ├── components/            # React components
│   │   │   │   ├── ui/                # Foundation components
│   │   │   │   ├── features/          # Feature components
│   │   │   │   ├── layout/            # Layout components
│   │   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── lib/                   # Utility functions
│   │   │   ├── store/                 # State management
│   │   │   └── types/                 # TypeScript types
│   └── backend/                       # Backend API service
├── packages/                          # Shared libraries
│   ├── ui/                            # Shared UI components
│   ├── config/                        # Shared configuration
│   └── utils/                         # Common utilities
```

---

## 3. Component System

### 3.1 Component Hierarchy

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

### 3.2 Composition Patterns

**Server/Client Component Pattern**

```tsx
// Server component for data fetching
async function PointsSection({ userId }) {
  // Fetch data on the server
  const pointsData = await fetchPointsData(userId);
  const trends = await calculateTrends(pointsData);
  
  // Pass data to client component for interactivity
  return <PointsClientView initialData={pointsData} trends={trends} />;
}

// Client component for interactivity
'use client';
function PointsClientView({ initialData, trends }) {
  const [activeView, setActiveView] = useState('daily');
  
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

**Logic Extraction with Hooks**

```tsx
// Separate logic from presentation
function usePointsBalance(userId) {
  const { data, isLoading } = useQuery({
    queryKey: ['points', userId],
    queryFn: () => fetchUserPoints(userId)
  });
  
  return {
    balance: data?.balance || 0,
    isLoading
  };
}

// Usage in component
function PointsDisplay({ userId }) {
  const { balance, isLoading } = usePointsBalance(userId);
  
  if (isLoading) return <PointsSkeleton />;
  return <PointsCounter value={balance} />;
}
```

### 3.3 Naming Conventions

| Category | Convention | Examples |
|----------|------------|----------|
| **Files** | PascalCase for components, camelCase for utilities | `Button.tsx`, `usePoints.ts` |
| **Components** | PascalCase | `UserProfile`, `ButtonGroup` |
| **Props** | PascalCase with Component + Props | `ButtonProps`, `CardProps` |
| **Hooks** | camelCase with `use` prefix | `usePoints`, `useWalletConnection` |
| **Functions** | camelCase with verb for actions | `fetchUserData`, `calculateRewards` |
| **CSS** | Tailwind classes, kebab-case for custom | `bg-primary-500`, `points-display` |

---

## 4. State Management

### 4.1 State Classification

| State Type | Definition | Storage Method | Examples |
|------------|------------|----------------|----------|
| **UI State** | Visual/interaction state | Local (useState/useReducer) | Modal open/closed, form field values |
| **Feature State** | State specific to a single feature | Feature store (Zustand slice) | Current step in multi-step flow |
| **Shared State** | State needed across multiple features | Global store (Zustand) | Current user profile, points balance |
| **Server State** | Data from backend requiring caching | React Query | User data, content feeds, leaderboards |
| **URL State** | State that should be shareable via URL | URL parameters | Current tab, filters, search queries |

**State Management Decision Tree**:
1. Is the state URL-addressable? → Use URL parameters
2. Is the state only used by a single component? → Use React's useState/useReducer
3. Is the state server data that needs caching? → Use React Query
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
    
    // API call to persist
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
export function useLeaderboard(filters) {
  return useQuery({
    queryKey: ['leaderboard', filters],
    queryFn: async () => {
      const data = await fetch(`/api/leaderboard?${new URLSearchParams(filters)}`);
      if (!data.ok) throw new Error('Failed to fetch leaderboard');
      return data.json();
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}
```

---

## 5. User Interface

### 5.1 Design Tokens

**Colors**
```typescript
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
const typography = {
  fontFamily: {
    display: ['Montserrat', 'sans-serif'],
    body: ['Inter', 'sans-serif'],
    mono: ['Roboto Mono', 'monospace'],
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

**Spacing & Breakpoints**
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

// Responsive breakpoints
const screens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}
```

### 5.2 Styling Approach

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

### 5.3 Animation System

**Animation Tokens**

| Token | Value | Usage |
|-------|-------|-------|
| `duration-xs` | 100ms | Micro-interactions (button press) |
| `duration-sm` | 200ms | Simple transitions (opacity, color) |
| `duration-md` | 300ms | Standard transitions (modals, pages) |
| `duration-lg` | 500ms | Complex transitions (page transitions) |
| `duration-xl` | 800ms | Celebrations (achievements, milestones) |
| `ease-standard` | cubic-bezier(0.4, 0.0, 0.2, 1) | Standard easing for transitions |
| `ease-emphatic` | cubic-bezier(0.2, 0.9, 0.3, 1.3) | Slight overshooting for emphasis |

**Achievement Animation Example**

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

**Animation Best Practices**:
- Animate only `transform` and `opacity` for performance
- Use `will-change` property sparingly
- Respect `prefers-reduced-motion` user preferences
- Test animations on low-end devices

---

## 6. Performance & Accessibility

### 6.1 Performance Targets

| Metric | Target | Measurement Tool |
|--------|--------|------------------|
| First Contentful Paint (FCP) | < 1.8s | Lighthouse, Web Vitals |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse, Web Vitals |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse, Web Vitals |
| First Input Delay (FID) | < 100ms | Web Vitals |
| Interaction to Next Paint (INP) | < 200ms | Web Vitals |
| Initial JavaScript Size | < 150KB (compressed) | Webpack Bundle Analyzer |
| Time To Interactive (TTI) | < 3.5s | Lighthouse |

### 6.2 Optimization Strategies

**Server Components**
- Use React Server Components for content-heavy pages
- Move data fetching to the server
- Keep large data sets on the server

**Edge Computing**
- Deploy computation to edge locations for global performance
- Use edge middleware for location-specific features
- Implement regional data centers for compliance and performance

**Code Splitting**
- Use Next.js's built-in route-based code splitting
- Implement dynamic imports for large components
- Lazy load below-the-fold content

**Image Optimization**
- Use Next.js Image component for automatic optimization
- Implement responsive images with appropriate sizes
- Apply lazy loading for below-the-fold images
- Use modern formats (WebP, AVIF) with fallbacks

**Rendering Optimization**
- Memoize expensive components with React.memo
- Use React.useCallback for event handlers in loops
- Apply React.useMemo for expensive calculations
- Implement virtualization for long lists

### 6.3 Accessibility Requirements

**Core Requirements**
1. **Keyboard Navigation**: All interactive elements must be keyboard accessible
2. **Screen Reader Support**: All content must be accessible to screen readers
3. **Color Contrast**: Text must have a minimum contrast ratio of 4.5:1 (3:1 for large text)
4. **Text Resizing**: Interface must be usable when text is resized up to 200%
5. **Focus Indicators**: Visible focus indicators for all interactive elements
6. **Alternative Text**: All meaningful images must have appropriate alt text
7. **Form Labels**: All form controls must have properly associated labels
8. **Error Identification**: Form errors must be clearly identified and described
9. **Motion Control**: Animation must respect prefers-reduced-motion settings
10. **Page Structure**: Proper heading hierarchy and landmark regions

**Accessible Form Field Example**

```tsx
// Accessible form field
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

## 7. Quality Assurance

### 7.1 Testing Strategy

| Test Type | Coverage Target | Tools | When to Run |
|-----------|-----------------|-------|------------|
| **Unit Tests** | 80%+ of utility functions and hooks | Vitest, React Testing Library | On every code change, in CI |
| **Component Tests** | 70%+ of UI components | Vitest, React Testing Library | On component changes, in CI |
| **Integration Tests** | 60%+ of key user flows | Vitest, React Testing Library | On feature changes, in CI |
| **E2E Tests** | 40%+ of critical user journeys | Playwright | On major changes, daily in CI |
| **Visual Regression** | 50%+ of key UI components | Chromatic, Storybook | On UI changes, in CI |
| **Accessibility Tests** | 90%+ of all components | axe-core, Lighthouse | On every PR, in CI |

**Component Test Example**

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
});
```

### 7.2 Code Quality Tools

**ESLint Configuration**

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

### 7.3 Anti-Pattern Prevention

| Anti-Pattern | Description | How to Fix |
|--------------|-------------|------------|
| **Component Bloat** | Components with too many props and responsibilities | Split into smaller, focused components with clear responsibilities |
| **Prop Drilling** | Passing props through many component layers | Use Context for widely shared state, composition patterns |
| **Direct DOM Manipulation** | Bypassing React's declarative model | Use refs properly, embrace declarative patterns |
| **Style Inconsistency** | Mixing multiple styling approaches | Standardize on Tailwind, use design tokens |
| **Premature Optimization** | Optimizing before measuring performance | Measure first, optimize proven bottlenecks |

**Refactoring Example: Component Bloat**

```tsx
// BEFORE: Bloated component with many responsibilities
const UserProfileCard = ({ user, onFollow, expanded, toggleExpanded, showStats }) => {
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

// AFTER: Split into focused components
// UserAvatar component
const UserAvatar = ({ user }) => (
  <Image src={user.avatar} alt={`${user.name}'s avatar`} width={64} height={64} className="rounded-full" />
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
        {expanded ? <p>{user.bio}</p> : <p>{user.bio.substring(0, 100)}...</p>}
        {expanded && <UserStats {...user} />}
        <Button variant="link" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show Less' : 'Show More'}
        </Button>
      </Card.Content>
      <Card.Footer>
        <Button variant="primary" onClick={() => onFollow(user.id)}>
          {user.isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
      </Card.Footer>
    </Card>
  );
};
```

---

## 8. Implementation Patterns

### 8.1 Server/Client Integration

**Server Component with Client Hydration**

```tsx
// Server component with selective client hydration
import { notFound } from 'next/navigation';
import { PointsClientView } from './client';

export default async function UserProfilePage({ params }) {
  const { userId } = params;
  
  // Server-side data fetching
  const userData = await fetchUserProfile(userId);
  if (!userData) return notFound();
  
  // Points data for the dashboard
  const pointsData = await fetchUserPoints(userId);
  const achievements = await fetchUserAchievements(userId);
  
  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1>{userData.displayName}</h1>
        <p>{userData.bio}</p>
      </header>
      
      {/* Client component for interactive points display */}
      <PointsClientView 
        initialData={pointsData} 
        achievements={achievements} 
        userId={userId} 
      />
      
      {/* Server-rendered content history */}
      <section>
        <h2>Content History</h2>
        <UserContentList userId={userId} />
      </section>
    </div>
  );
}
```

### 8.2 Data Mutation

**Server Action Form Pattern**

```tsx
// Server action for form submission
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// Validation schema
const PostFormSchema = z.object({
  title: z.string().min(3).max(100),
  content: z.string().min(10).max(5000),
  category: z.string().min(1)
})

// Form action
export async function createPost(formData) {
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
  
  // Save to database
  try {
    const post = await db.post.create({
      data: {
        title: result.data.title,
        content: result.data.content,
        category: result.data.category,
        authorId: 'current-user-id' // Replace with actual user ID
      }
    })
    
    // Revalidate related pages
    revalidatePath('/community')
    
    return { success: true, postId: post.id }
  } catch (error) {
    return { error: 'Failed to create post. Please try again.' }
  }
}

// Client component using server action
'use client'

import { useFormStatus } from 'react-dom'
import { createPost } from '@/app/actions'

function CreatePostForm() {
  const { pending } = useFormStatus()
  
  return (
    <form action={createPost} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input id="title" name="title" type="text" required />
      </div>
      
      <div>
        <label htmlFor="category" className="block text-sm font-medium">
          Category
        </label>
        <select id="category" name="category" required>
          <option value="">Select a category</option>
          <option value="general">General Discussion</option>
          <option value="token">Token Talk</option>
          <option value="media">Memes & Media</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="content" className="block text-sm font-medium">
          Content
        </label>
        <textarea id="content" name="content" rows={5} required />
      </div>
      
      <button
        type="submit"
        disabled={pending}
        className="py-2 px-4 bg-primary text-white rounded-md disabled:opacity-50"
      >
        {pending ? 'Creating Post...' : 'Create Post'}
      </button>
    </form>
  )
}
```

### 8.3 Media Management

**Vercel Blob Integration**

```tsx
'use client'

import { useState } from 'react'
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
    
    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please select an image file (JPG, PNG, GIF, WEBP)')
      return
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }
    
    // Set file and create preview
    setFile(selectedFile)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return
    
    try {
      setUploading(true)
      setError(null)
      
      // Upload to Vercel Blob
      const { url, blobId } = await uploadToBlob(file)
      
      // Notify parent component
      onUploadComplete({ url, blobId, fileName: file.name })
      
    } catch (err) {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <input type="file" onChange={handleFileChange} accept="image/*" />
      
      {error && <div className="text-sm text-alert">{error}</div>}
      
      {preview && (
        <div className="relative h-64 overflow-hidden rounded-lg">
          <Image src={preview} alt="Upload preview" fill className="object-contain" />
          <p className="mt-2 text-sm">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
        </div>
      )}
      
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="py-2 px-4 bg-primary text-white rounded-md disabled:opacity-50"
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
  const fileExtension = file.name.split('.').pop()
  const uniqueFilename = `${nanoid()}.${fileExtension}`
  
  // Upload to Vercel Blob
  const { url, blobId } = await put(uniqueFilename, file, {
    access: 'public',
    contentType: file.type
  })
  
  return { url, blobId }
}
```
