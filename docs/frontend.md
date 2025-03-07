# Wild 'n Out Meme Coin Platform - Frontend Guidelines

## Getting Started

### Document Purpose
This document serves as the definitive reference for frontend development standards for the Wild 'n Out Meme Coin platform. It provides clear, actionable guidance to ensure technical decisions directly support our path to $500M+ market cap by delivering the authentic Wild 'n Out experience.

### How to Use This Document
This document uses a progressive disclosure approach:
- **Essential Patterns** - Core concepts every developer must implement
- **Implementation Details** - Deeper technical guidance for specific scenarios
- **Advanced Patterns** - Specialized approaches for complex requirements

| Developer Role | Recommended Sections | Primary Focus |
|----------------|----------------------|--------------|
| **New Developers** | Getting Started, Essential Patterns | Core patterns and project structure |
| **Frontend Developers** | All sections | Implementation details and technical decisions |
| **Tech Leads** | Strategic sections, Quality Assessments | Architectural decisions and governance |
| **Product/Design** | UX Principles, Design System, Animation | Business alignment and user experience |

### Quick Start Checklist
- [ ] Review Strategic Foundation to understand business objectives
- [ ] Set up development environment with recommended tooling
- [ ] Study Component Architecture for Server/Client Component patterns
- [ ] Implement foundation UI components with accessibility best practices
- [ ] Configure testing and performance monitoring

## 1. Strategic Foundation

### 1.1 Business Impact Analysis

| Business Objective | Frontend Strategy | Measurable Impact | Priority |
|-------------------|-------------------|-------------------|----------|
| **Achieve $10M → $50M → $100M → $500M+ market cap progression** | Implement visually engaging token milestone tracking, celebration moments, and performance-optimized experiences | • Market cap growth rate<br>• Milestone visualization engagement<br>• Social sharing metrics | Critical |
| **Build community with 30%+ DAU/MAU ratio** | Create compelling battle experiences, achievement systems, and real-time engagement features | • Daily/weekly active users<br>• Session frequency and duration<br>• Return rate within 24 hours | High |
| **Drive content creation from 20% of users** | Develop intuitive creation tools, recognition mechanics, and distribution systems | • Creation attempt rate<br>• Creation completion rate<br>• Content engagement metrics | High | 
| **Achieve 25%+ wallet connection rate** | Design seamless wallet integration with clear value proposition and immediate benefits | • Wallet connection rate<br>• Abandonment points in flow<br>• Post-connection engagement | Medium |
| **Build 45% Day 7 retention** | Implement progressive engagement ladders, achievement systems, and daily reward mechanics | • Day 1/7/30 retention rates<br>• Achievement progression<br>• Feature adoption breadth | Critical |

### 1.2 User Experience Principles

#### High-Energy Entertainment
**Definition**: Every interaction should capture the Wild 'n Out show's spontaneous, vibrant energy

**Implementation**: 
- Use dynamic animations, celebratory moments, and personality-rich feedback
- Prioritize content visibility and engagement over technical complexity
- Create moments of surprise and delight that reflect the show's improvisational energy

**Business Impact**: Increases session duration and return frequency through emotional connection

#### Battle Ready
**Definition**: Create fair, exciting competitive experiences that reward creativity while being accessible

**Implementation**:
- Design clear competitive frameworks with transparent judging mechanisms
- Create staged progression that welcomes newcomers while challenging veterans
- Provide immediate, energetic feedback on competitive actions

**Business Impact**: Drives content creation and community participation metrics

#### Community Spotlight
**Definition**: Recognize and elevate user contributions throughout the experience

**Implementation**:
- Implement achievement badges, visibility systems, progression mechanics
- Design systems that reward continued participation
- Ensure visibility for diverse types of contributions, not just winners

**Business Impact**: Increases content creation rates and quality of submissions

#### Mobile Momentum
**Definition**: Optimize for on-the-go, single-handed mobile experiences with quick engagement opportunities

**Implementation**:
- Design for thumb-zone focused controls
- Create meaningful micro-sessions that deliver value in 2-3 minutes
- Ensure performance and efficiency in all interactions

**Business Impact**: Increases session frequency and overall platform accessibility

### 1.3 Strategic Quality Assessment

✅ **Business objectives have clear, measurable frontend implementation strategies**

✅ **UX principles directly connect to specific business outcomes and metrics**

✅ **Technical standards align with market cap progression goals**

✅ **Mobile experience is prioritized appropriately for target audience**

✅ **Retention and engagement strategies are concrete and measurable**

## 2. Technology Stack

### 2.1 Core Technologies

| Technology | Version | Purpose | Selection Rationale | Evolution Plan |
|------------|---------|---------|---------------------|----------------|
| **Next.js** | 15.2+ | Application framework | Optimal performance with streaming, superior DX, and enhanced SEO capabilities | Monitor v16 for Turbopack production builds |
| **React** | 19.1+ | UI library | Advanced server components, streaming capabilities, and integrated hooks for forms | Adopt upcoming View Transitions API and useFormStatus |
| **TypeScript** | 5.4+ | Type safety | Improved developer experience, error prevention, and better IDE support | Monitor for v5.5+ improvements |
| **Tailwind CSS** | 4.0+ | Styling | Delivers consistent design through utility classes with improved performance | Explore container queries and dynamic utility values |
| **Clerk** | Latest | Authentication | Simplified auth flow, pre-built components, and robust security | Monitor for next-gen auth technologies |
| **Fastify** | Latest | Server APIs | High-performance, low-overhead API implementation with robust plugin architecture | Monitor for performance improvements |

### 2.2 Key Architectural Decisions

#### Server Components vs. Client Components

**Decision**: Default to Server Components, use Client Components only when necessary.

**Options Considered**:
- ❌ **Client-heavy**: More interactive but larger bundle
- ✅ **Server-heavy**: Better performance but less interactivity
- ❌ **Balanced**: Strategic mix based on component needs

**Rationale**: Server Components provide optimal performance by reducing client-side JavaScript while maintaining rich user experiences.

**Implementation Guidance**:
- Use Server Components for data fetching and static content
- Add 'use client' directive only when using:
  - React hooks (useState, useEffect, etc.)
  - Browser-only APIs (localStorage, window, etc.)
  - Event handlers (onClick, onChange, etc.)
  - Client-side form validation
  - Component class lifecycle methods

```tsx
// ✅ GOOD: Server Component for data display
export default async function UserProfile({ userId }) {
  // Data fetching in Server Component
  const user = await fetchUser(userId);
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
      {/* Client Component only where needed */}
      <UserActions userId={userId} />
    </div>
  );
}

// ✅ GOOD: Client Component for interactivity
'use client';

import { useState } from 'react';

export function UserActions({ userId }) {
  const [isFollowing, setIsFollowing] = useState(false);
  
  return (
    <button onClick={() => setIsFollowing(!isFollowing)}>
      {isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
}
```

#### App Router Implementation

**Decision**: Use App Router (app/ directory) for all new development.

**Rationale**: App Router provides significant performance improvements through streaming, built-in layouts, and first-class support for React Server Components.

**Implementation Guidance**:
- Organize routes in app/ directory with page.tsx and layout.tsx
- Use route groups (parentheses) for logical organization
- Implement loading.tsx for streaming UI
- Leverage parallel routes for complex UI patterns

```
app/
├── (auth)/                     # Route group for authentication pages
│   ├── sign-in/                # Sign-in page
│   └── sign-up/                # Sign-up page
├── api/                        # API route handlers
├── battle/                     # Battle-related pages
│   ├── [id]/                   # Individual battle page
│   └── page.tsx                # Battle listing page
├── layout.tsx                  # Root layout
└── page.tsx                    # Homepage
```

#### Authentication Strategy

**Decision**: Implement Clerk authentication with middleware-based route protection.

**Rationale**: Clerk provides ready-to-use auth components, robust security features, and simplified management compared to building custom auth.

**Implementation Guidance**:
- Use Clerk's middleware for route protection
- Implement sign-in and sign-up pages in the (auth) route group
- Access user information with Clerk's useUser() hook in Client Components
- Fetch user information with auth() and currentUser() in Server Components

### 2.3 Strategic Quality Assessment

✅ **Technology choices directly support key business metrics (performance, engagement)**

✅ **Server Component approach maximizes performance for mobile users**

✅ **Clear decision criteria exists for Server vs. Client Components**

✅ **App Router implementation follows latest Next.js best practices**

✅ **Authentication strategy provides security while optimizing developer experience**

## 3. Code Organization and Structure

### 3.1 Project Folder Structure

```
apps/frontend/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Authentication routes
│   │   ├── sign-in/            # Sign-in page (page.tsx, layout.tsx if needed)
│   │   ├── sign-up/            # Sign-up page
│   │   └── forgot-password/    # Password recovery flow
│   ├── (marketing)/            # Public marketing pages
│   │   ├── about/              # About page
│   │   ├── token/              # Token information for non-users
│   │   └── page.tsx            # Homepage/landing page
│   ├── (platform)/             # Authenticated platform experience
│   │   ├── battle/             # Battle-related pages
│   │   │   ├── [id]/           # Individual battle page
│   │   │   ├── create/         # Battle creation flow
│   │   │   └── page.tsx        # Battle listing/discovery page
│   │   ├── community/          # Community pages
│   │   ├── profile/            # User profile pages
│   │   └── token/              # Token hub pages
│   ├── api/                    # API route handlers
│   ├── @modal/                 # Parallel route for modals
│   ├── [locale]/               # i18n route groups (future)
│   ├── global-error.tsx        # Global error boundary
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Root page (may redirect to /auth or /platform)
├── components/                 # Shared components
│   ├── ui/                     # Generic UI components
│   ├── features/               # Feature-specific components
│   │   ├── battle/             # Battle-related components
│   │   ├── community/          # Community components
│   │   ├── creation/           # Content creation components
│   │   ├── profile/            # Profile components
│   │   └── token/              # Token-related components
│   └── layout/                 # Layout components
├── hooks/                      # Custom React hooks
├── lib/                        # Utility functions and shared code
│   ├── api/                    # API client and related utilities
│   ├── auth/                   # Authentication utilities
│   ├── actions/                # Server actions
│   ├── blockchain/             # Blockchain integration
│   └── utils/                  # General utilities
├── providers/                  # React context providers
├── types/                      # TypeScript type definitions
├── styles/                     # Global styles and themes
└── public/                     # Static assets
```

### 3.2 Naming Conventions

| Element | Convention | Example | Notes |
|---------|------------|---------|-------|
| **Route Files** | lowercase | page.tsx, layout.tsx | Use Next.js standard file names |
| **Components** | PascalCase | BattleCard.tsx | Match component name to file name |
| **Client Components** | Add 'use client' directive | 'use client';<br>export function Button() | Only add when required |
| **Server Actions** | async function | async function submitForm() | Use form action prop |
| **Context Providers** | [Name]Provider | BattleProvider | Add useContext hook |
| **Custom Hooks** | use[Name] | useAuthentication | Follow React conventions |
| **Utils** | camelCase | formatDate.ts | Descriptive verb + noun |
| **Types** | PascalCase | BattleProps | Add .d.ts or types.ts suffix |
| **CSS Classes** | Tailwind utilities | bg-wild-black text-hype-white | Use design tokens for custom values |

### 3.3 Module Boundaries

**Feature Modules**
- Keep related components, hooks, and utilities together
- Export only what's needed through index files
- Maintain clear responsibility boundaries

**Component Organization**
- Group related components in feature folders
- Place reusable UI components in `components/ui`
- Co-locate component, tests, and types

**Server/Client Boundaries**
- Keep Server and Client code in separate files
- Never import Client Components into Server Components
- Use props to pass data from Server to Client Components
- Use Server Actions for mutations from Client Components

### 3.4 Strategic Quality Assessment

✅ **Project structure optimized for Next.js App Router architecture**

✅ **Naming conventions are consistent and follow team standards**

✅ **Module boundaries maintain clear separation of concerns**

✅ **Server/Client component separation is properly maintained**

✅ **Structure supports efficient code splitting and load optimization**

## 4. Component Architecture

### 4.1 Component Hierarchy Model

1. **Page Components** (Server)
   - Handle data fetching and initial rendering
   - Define page-level layout and composition
   - Pass data to lower-level components

2. **Feature Components** (Server or Client)
   - Implement domain-specific features
   - Maintain feature-specific state (if Client)
   - Compose UI components for complex features

3. **UI Components** (Usually Client)
   - Reusable building blocks (Button, Card, etc.)
   - Handle user interactions and local state
   - Maintain accessibility and design consistency

```tsx
// Server Component hierarchy example
export default async function BattlePage({ params }) {
  // Data fetching in Server Component
  const battle = await fetchBattle(params.id);
  const participants = await fetchParticipants(params.id);
  
  return (
    <main>
      {/* Feature component (Server) */}
      <BattleHeader battle={battle} />
      
      {/* Feature component with Client interactivity */}
      <BattleActions battleId={params.id} userStatus={battle.userStatus} />
      
      {/* UI component composition */}
      <section>
        <h2>Participants</h2>
        <ParticipantList participants={participants} />
      </section>
    </main>
  );
}
```

### 4.2 Component Composition Patterns

#### Composition Over Configuration

```tsx
// ✅ GOOD: Composable pattern
function Card({ children, footer, header }) {
  return (
    <div className="card">
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

// Usage
<Card
  header={<h2>Battle Results</h2>}
  footer={<Button>Share Results</Button>}
>
  <BattleStats stats={battleData} />
</Card>
```

#### Render Props for Flexibility

```tsx
// ✅ GOOD: Render props pattern
function BattleCard({ 
  battle, 
  renderActions, 
  renderParticipants 
}) {
  return (
    <div className="battle-card">
      <h3>{battle.title}</h3>
      <div className="battle-card-participants">
        {renderParticipants(battle.participants)}
      </div>
      <div className="battle-card-actions">
        {renderActions(battle)}
      </div>
    </div>
  );
}

// Usage
<BattleCard
  battle={activeBattle}
  renderParticipants={(participants) => (
    <AvatarGroup users={participants} maxDisplay={5} />
  )}
  renderActions={(battle) => (
    battle.isActive ? <JoinButton battleId={battle.id} /> : <ResultsButton battleId={battle.id} />
  )}
/>
```

#### Server Component Data Passing

```tsx
// ✅ GOOD: Server Component fetching data for Client Components
// app/battles/[id]/page.tsx
export default async function BattlePage({ params }) {
  // Fetch data once at the server level
  const battle = await fetchBattle(params.id);
  const participants = await fetchParticipants(params.id);
  
  return (
    <div>
      {/* Pass data to Client Components */}
      <BattleHeader battle={battle} />
      <BattleActions battleId={params.id} status={battle.status} />
      <ParticipantsList participants={participants} />
    </div>
  );
}
```

### 4.3 State and Props Design

#### Props Design

```tsx
// ✅ GOOD: Clear props design with defaults
interface ButtonProps {
  /** Button variant style */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether button is in loading state */
  isLoading?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Button contents */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  onClick,
  children,
  className,
  ...props
}: ButtonProps) {
  // Implementation
}
```

#### State Location Decision Tree

1. **Is the state used by only this component?**
   - Yes → Local state (`useState`)
   - No → Continue

2. **Is the state shared by a few related components?**
   - Yes → Context API with a custom hook
   - No → Continue

3. **Is the state read-only data from the server?**
   - Yes → Use Server Component data fetching
   - No → Continue

4. **Is the state global app state?**
   - Yes → Use a global state library (Zustand recommended)
   - No → Reconsider your component hierarchy

### 4.4 Performance Optimization Strategies

#### React Server Components

```tsx
// ✅ GOOD: Server Component data fetching
export default async function UserProfile({ userId }) {
  // Data fetching happens on the server
  const user = await fetchUserProfile(userId);
  const achievements = await fetchUserAchievements(userId);
  
  return (
    <div>
      <ProfileHeader user={user} />
      <AchievementList achievements={achievements} />
      {/* Only add interactivity where needed */}
      <ProfileActions userId={userId} />
    </div>
  );
}
```

#### Memoization for Client Components

```tsx
// ✅ GOOD: Memoization to prevent re-renders
'use client';

import { useState, useMemo } from 'react';

function BattleLeaderboard({ entries }) {
  const [sortBy, setSortBy] = useState('score');
  
  // Memoized expensive calculation
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (sortBy === 'score') {
        return b.score - a.score;
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [entries, sortBy]);
  
  return (
    <div>
      <div className="leaderboard-controls">
        <button onClick={() => setSortBy('score')}>Sort by Score</button>
        <button onClick={() => setSortBy('recent')}>Sort by Recent</button>
      </div>
      <div className="leaderboard-entries">
        {sortedEntries.map(entry => (
          <LeaderboardEntry key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
```

#### Component Code-Splitting

```tsx
// ✅ GOOD: Lazy loading components
import { lazy, Suspense } from 'react';

// Lazy-loaded component
const BattleAnalytics = lazy(() => import('./BattleAnalytics'));

function BattleDetails({ battle }) {
  return (
    <div>
      <h1>{battle.title}</h1>
      <BattleInfo battle={battle} />
      
      {/* Lazily load analytics component */}
      <Suspense fallback={<div>Loading analytics...</div>}>
        <BattleAnalytics battleId={battle.id} />
      </Suspense>
    </div>
  );
}
```

### 4.5 Strategic Quality Assessment

✅ **Component hierarchy follows Server/Client Component best practices**

✅ **Composition patterns enable flexibility without prop drilling**

✅ **State management follows clear decision criteria**

✅ **Performance optimization strategies are applied consistently**

✅ **Component interfaces are well-typed with clear documentation**

## 5. State Management

### 5.1 State Classification

| State Type | Definition | Examples | Recommended Storage |
|------------|------------|----------|---------------------|
| **Server State** | Data fetched from backend | API responses, user profiles, battle data | React Server Components, React Cache |
| **UI State** | Visual/interaction state | Expanded/collapsed, selected tabs, focus state | React useState, DOM attributes |
| **Form State** | User input in forms | Input values, validation errors, submission state | React form hooks (useFormState, useFormStatus) |
| **Session State** | User authentication info | Login status, permissions, user details | Clerk auth hooks |
| **Navigation State** | Routing information | Current route, navigation history | Next.js router and hooks |

### 5.2 Implementation Patterns

#### Server State with React Cache

```tsx
// ✅ GOOD: Using React cache for data fetching
import { cache } from 'react';

// Cached function to prevent duplicate requests
export const fetchBattle = cache(async (battleId) => {
  const res = await fetch(`/api/battles/${battleId}`, {
    next: { revalidate: 60 } // Cache for 60 seconds
  });
  
  if (!res.ok) throw new Error('Failed to fetch battle');
  return res.json();
});

// Usage in a Server Component
export default async function BattlePage({ params }) {
  // This won't cause duplicate fetches even if called multiple times
  const battle = await fetchBattle(params.id);
  
  return (
    <div>
      <BattleHeader battle={battle} />
      <BattleDetails battle={battle} />
    </div>
  );
}
```

#### Form State with Server Actions

```tsx
// ✅ GOOD: Form state with Server Actions
// lib/actions.js
'use server';

export async function createBattle(prevState, formData) {
  // Validate form data
  const title = formData.get('title');
  const description = formData.get('description');
  
  if (!title || title.length < 3) {
    return { 
      success: false, 
      errors: { title: 'Title must be at least 3 characters' } 
    };
  }
  
  try {
    // Create battle in database
    const battle = await prisma.battle.create({
      data: { title, description }
    });
    
    return { 
      success: true, 
      battleId: battle.id
    };
  } catch (error) {
    return { 
      success: false, 
      errors: { form: 'Failed to create battle' } 
    };
  }
}

// BattleForm.js
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createBattle } from '@/lib/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Battle'}
    </button>
  );
}

export function BattleForm() {
  const [state, formAction] = useFormState(createBattle, { 
    success: false, 
    errors: {} 
  });
  
  return (
    <form action={formAction}>
      {state.errors?.form && (
        <div className="error">{state.errors.form}</div>
      )}
      
      <div>
        <label htmlFor="title">Title</label>
        <input 
          id="title" 
          name="title" 
          aria-invalid={Boolean(state.errors?.title)}
        />
        {state.errors?.title && (
          <div className="error">{state.errors.title}</div>
        )}
      </div>
      
      <div>
        <label htmlFor="description">Description</label>
        <textarea 
          id="description" 
          name="description"
          aria-invalid={Boolean(state.errors?.description)}
        />
        {state.errors?.description && (
          <div className="error">{state.errors.description}</div>
        )}
      </div>
      
      <SubmitButton />
    </form>
  );
}
```

#### UI State with useReducer

```tsx
// ✅ GOOD: Complex UI state with useReducer
'use client';

import { useReducer } from 'react';

// Define state shape and initial state
interface BattleUIState {
  activeTab: 'entries' | 'discussion' | 'leaderboard';
  entrySort: 'newest' | 'popular';
  showFilters: boolean;
  selectedFilter: string | null;
}

const initialState: BattleUIState = {
  activeTab: 'entries',
  entrySort: 'newest',
  showFilters: false,
  selectedFilter: null
};

// Define actions
type BattleUIAction =
  | { type: 'SET_TAB'; tab: BattleUIState['activeTab'] }
  | { type: 'SET_SORT'; sort: BattleUIState['entrySort'] }
  | { type: 'TOGGLE_FILTERS' }
  | { type: 'SET_FILTER'; filter: string | null };

// Create reducer
function battleUIReducer(state: BattleUIState, action: BattleUIAction): BattleUIState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'SET_SORT':
      return { ...state, entrySort: action.sort };
    case 'TOGGLE_FILTERS':
      return { ...state, showFilters: !state.showFilters };
    case 'SET_FILTER':
      return { ...state, selectedFilter: action.filter };
    default:
      return state;
  }
}

// Use in component
function BattleUI() {
  const [state, dispatch] = useReducer(battleUIReducer, initialState);
  
  return (
    <div>
      <TabNav
        activeTab={state.activeTab}
        onChange={(tab) => dispatch({ type: 'SET_TAB', tab })}
      />
      
      <div className="controls">
        <SortPicker
          value={state.entrySort}
          onChange={(sort) => dispatch({ type: 'SET_SORT', sort })}
        />
        
        <button onClick={() => dispatch({ type: 'TOGGLE_FILTERS' })}>
          {state.showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>
      
      {state.showFilters && (
        <Filters
          selected={state.selectedFilter}
          onChange={(filter) => dispatch({ type: 'SET_FILTER', filter })}
        />
      )}
      
      <TabContent tab={state.activeTab} sortBy={state.entrySort} filter={state.selectedFilter} />
    </div>
  );
}
```

### 5.3 Anti-patterns to Avoid

| Anti-Pattern | Example | Why It's Harmful | Better Approach |
|--------------|---------|------------------|----------------|
| **Prop Drilling** | Passing data through 5+ component levels | Tight coupling, refactoring difficulty | Use Context or composition patterns |
| **Global State Overuse** | Putting UI toggles in global state | Unnecessary re-renders, maintenance complexity | Keep UI state local to its component |
| **Direct API Calls in Components** | Fetching in each component that needs data | Duplicate requests, inconsistent loading states | Use Server Components or React Query |
| **Unstable References** | Creating new objects/functions on render | Unnecessary re-renders, performance issues | Use useMemo/useCallback for stability |
| **Mixing Server/Client State** | Duplicating server data in client state | Synchronization issues, inconsistency | Keep clear boundaries, prefer server data |

### 5.4 Strategic Quality Assessment

✅ **State is categorized and managed according to its type**

✅ **Server Component data fetching is used appropriately**

✅ **Form state uses modern React patterns**

✅ **Complex state uses reducers for predictability**

✅ **State management patterns align with business requirements**

## 6. Styling and Design System

### 6.1 Token System Structure

**Colors**

```css
@layer theme {
  :root {
    /* Primary Colors */
    --color-wild-black: #121212;
    --color-battle-yellow: #E9E336;
    --color-hype-white: #FFFFFF;
    
    /* Secondary Colors */
    --color-victory-green: #36E95C;
    --color-roast-red: #E93636;
    --color-flow-blue: #3654E9;
    
    /* State Colors */
    --color-success: var(--color-victory-green);
    --color-error: var(--color-roast-red);
    --color-info: var(--color-flow-blue);
    --color-warning: oklch(0.8 0.2 80);
    --color-disabled: oklch(0.7 0 0);
    
    /* Semantic Colors */
    --color-background: var(--color-wild-black);
    --color-foreground: var(--color-hype-white);
    --color-primary: var(--color-battle-yellow);
    --color-secondary: var(--color-flow-blue);
    --color-accent: var(--color-victory-green);
  }
}
```

**Typography**

```css
@layer theme {
  :root {
    /* Font Families */
    --font-display: "Knockout", sans-serif;
    --font-body: "Inter", sans-serif;
    --font-accent: "Druk", sans-serif;
    
    /* Font Sizes */
    --text-display: 2rem;     /* 32px */
    --text-headline: 1.5rem;  /* 24px */
    --text-subhead: 1.125rem; /* 18px */
    --text-body: 1rem;        /* 16px */
    --text-caption: 0.875rem; /* 14px */
    
    /* Line Heights */
    --leading-tight: 1;
    --leading-normal: 1.5;
    --leading-loose: 1.75;
    
    /* Font Weights */
    --weight-normal: 400;
    --weight-medium: 500;
    --weight-bold: 700;
    --weight-black: 900;
  }
}
```

**Spacing**

```css
@layer theme {
  :root {
    /* Base Spacing Unit */
    --spacing: 0.25rem; /* 4px */
    
    /* Derived Spacing Values */
    /* All utilities like mt-4, px-6, gap-8 etc. use this scale */
    /* e.g., mt-4 = margin-top: calc(var(--spacing) * 4); */
  }
}
```

### 6.2 Implementation Patterns

#### Utility-First Approach

```tsx
// ✅ GOOD: Utility-first styling
function BattleCard({ battle }) {
  return (
    <div className="rounded-lg bg-wild-black border border-zinc-800 p-6 relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <span className="text-battle-yellow font-accent text-sm uppercase">
          {battle.type}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs ${
          battle.status === 'active' 
            ? 'bg-victory-green/20 text-victory-green' 
            : 'bg-flow-blue/20 text-flow-blue'
        }`}>
          {battle.status}
        </span>
      </div>
      <h3 className="text-headline font-display text-hype-white mb-2">
        {battle.title}
      </h3>
      <div className="flex justify-between text-caption text-hype-white/70">
        <span>{battle.participants} participants</span>
        <span>{formatTimeRemaining(battle.endTime)}</span>
      </div>
    </div>
  );
}
```

#### Component Variants with cva

```tsx
// ✅ GOOD: Component variants with cva
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all",
  {
    variants: {
      variant: {
        primary: "bg-battle-yellow text-wild-black hover:bg-battle-yellow/90",
        secondary: "bg-flow-blue text-hype-white hover:bg-flow-blue/90",
        ghost: "bg-transparent hover:bg-hype-white/10",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  isLoading,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2">
          <LoadingSpinner />
        </span>
      ) : null}
      {children}
    </button>
  );
}
```

#### Container Queries

```tsx
// ✅ GOOD: Using container queries
export function BattleDetail({ battle }) {
  return (
    <div className="@container">
      <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
        <div className="battle-info">
          <h1 className="text-headline @lg:text-display font-display text-hype-white">
            {battle.title}
          </h1>
          <p className="text-body text-hype-white/80 mt-2">
            {battle.description}
          </p>
        </div>
        <div className="battle-participants @lg:overflow-y-auto @lg:max-h-[600px]">
          <h2 className="text-subhead font-display text-battle-yellow mb-4">
            Participants
          </h2>
          <ParticipantsList participants={battle.participants} />
        </div>
      </div>
    </div>
  );
}
```

### 6.3 Strategic Quality Assessment

✅ **Design token system provides consistent visual language**

✅ **Implementation patterns follow utility-first approach**

✅ **Component variants are well-defined and reusable**

✅ **Responsive design uses modern approaches (container queries)**

✅ **Code consistently follows established styling patterns**

## 7. Animation and Motion

### 7.1 Animation Token System

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | 100ms | Button presses, micro-interactions |
| `--duration-quick` | 200ms | State changes, hover effects |
| `--duration-standard` | 300ms | Normal transitions, UI changes |
| `--duration-emphasis` | 450ms | Important state changes, battle transitions |
| `--duration-celebration` | 800ms | Achievements, milestones, victories |
| `--easing-standard` | cubic-bezier(0.2, 0, 0, 1) | Default for most animations |
| `--easing-energetic` | cubic-bezier(0.2, 0, 0, 1.3) | Adds slight overshoot for emphasis |
| `--easing-bounce` | cubic-bezier(0.15, 1.15, 0.5, 1) | Used for celebrations and achievements |

### 7.2 Implementation Patterns

#### CSS Transitions

```css
/* ✅ GOOD: Token-based CSS transitions */
.button {
  transition: transform var(--duration-instant) var(--easing-standard);
}

.button:active {
  transform: scale(0.97);
}

.card {
  transition: box-shadow var(--duration-quick) var(--easing-standard),
              transform var(--duration-quick) var(--easing-standard);
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}
```

#### Framer Motion for Complex Animations

```tsx
// ✅ GOOD: Framer Motion for complex animations
'use client';

import { motion } from 'framer-motion';

export function AchievementUnlock({ achievement, isNew }) {
  // Use animation tokens for consistency
  const duration = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--duration-celebration')) / 1000;
  
  const easingBounce = getComputedStyle(document.documentElement)
    .getPropertyValue('--easing-bounce');
  
  return (
    <motion.div
      className="achievement-card"
      initial={isNew ? { scale: 0.8, opacity: 0, y: 20 } : false}
      animate={isNew ? { scale: 1, opacity: 1, y: 0 } : false}
      transition={{ 
        duration: duration,
        ease: easingBounce
      }}
    >
      <div className="achievement-icon">
        <motion.div
          initial={isNew ? { rotate: -10, scale: 0.9 } : false}
          animate={isNew ? { rotate: 0, scale: 1.1, transition: { delay: 0.3 } } : false}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
        >
          <img src={achievement.icon} alt="" />
        </motion.div>
      </div>
      <h3 className="achievement-title">{achievement.title}</h3>
      <p className="achievement-description">{achievement.description}</p>
    </motion.div>
  );
}
```

#### Battle Countdown Animation

```tsx
// ✅ GOOD: Countdown animation with Framer Motion
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export function BattleCountdown({ seconds = 3, onComplete }) {
  const [count, setCount] = useState(seconds);
  
  useEffect(() => {
    if (count <= 0) {
      onComplete?.();
      return;
    }
    
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);
  
  return (
    <div className="flex justify-center items-center h-40">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={count}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ 
            duration: 0.7, 
            ease: "backOut" 
          }}
          className="text-7xl font-display"
        >
          {count > 0 ? count : "GO!"}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

### 7.3 Accessibility Considerations

```tsx
// ✅ GOOD: Respecting reduced motion preferences
'use client';

import { useReducedMotion } from 'framer-motion';

function AccessibleAnimation({ children }) {
  const prefersReducedMotion = useReducedMotion();
  
  // Define alternative animations for reduced motion
  const animation = prefersReducedMotion
    ? {
        // Simple fade for users who prefer reduced motion
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 }
      }
    : {
        // Full animation for others
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: "easeOut" }
      };
  
  return <motion.div {...animation}>{children}</motion.div>;
}
```

### 7.4 Strategic Quality Assessment

✅ **Animation token system ensures consistent motion design**

✅ **Implementation patterns use appropriate animation techniques**

✅ **Accessibility considerations are integrated into animation design**

✅ **Performance impact is considered in animation implementation**

✅ **Animations enhance the Wild 'n Out brand experience**

## 8. Performance Optimization

### 8.1 Performance Targets

| Metric | Target | Critical Threshold | Business Impact |
|--------|--------|-------------------|----------------|
| First Contentful Paint (FCP) | < 1.5s | < 2.5s | Initial engagement, bounce rate |
| Largest Contentful Paint (LCP) | < 2.5s | < 4s | Perceived load speed, user satisfaction |
| Time to Interactive (TTI) | < 3.5s | < 5s | Early engagement, initial actions |
| Cumulative Layout Shift (CLS) | < 0.1 | < 0.25 | Frustration reduction, error prevention |
| First Input Delay (FID) | < 100ms | < 300ms | Responsive feel, interaction confidence |
| Initial Bundle Size | < 200KB | < 300KB | Load time, mobile performance |

### 8.2 Critical Optimization Techniques

#### Server Components for Data Fetching

```tsx
// ✅ GOOD: Server Component data fetching
export default async function BattleFeed() {
  // Fetch data on server without client-side JavaScript
  const battles = await fetchBattles();
  
  return (
    <div className="battle-feed">
      <h1>Active Battles</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {battles.map(battle => (
          <BattleCard key={battle.id} battle={battle} />
        ))}
      </div>
    </div>
  );
}
```

#### Image Optimization

```tsx
// ✅ GOOD: Next.js Image component
import Image from 'next/image';

function UserAvatar({ user }) {
  return (
    <div className="relative size-12 rounded-full overflow-hidden">
      <Image
        src={user.avatarUrl}
        alt=""
        fill
        sizes="(max-width: 768px) 48px, 96px"
        className="object-cover"
        priority={false}
      />
    </div>
  );
}
```

#### Virtualized Lists

```tsx
// ✅ GOOD: Virtualized lists for large datasets
'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

function CommentsList({ comments }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: comments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });
  
  return (
    <div 
      ref={parentRef}
      className="h-[500px] overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <CommentItem comment={comments[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Strategic Code Splitting

```tsx
// ✅ GOOD: Route-based code splitting with Next.js
// app/(dashboard)/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <main>{children}</main>
    </div>
  );
}

// Separate route bundles for different dashboard sections
// app/(dashboard)/battle/page.tsx
// app/(dashboard)/profile/page.tsx
// app/(dashboard)/token/page.tsx
```

### 8.3 Performance Monitoring

**Core Web Vitals Monitoring**

```tsx
// ✅ GOOD: Monitoring Core Web Vitals
'use client';

import { useEffect } from 'react';
import { onCLS, onFID, onLCP } from 'web-vitals';

export function WebVitalsReporter() {
  useEffect(() => {
    // Report Core Web Vitals to analytics
    const reportVital = ({ name, delta, id }) => {
      // Send to analytics service
      analytics.track('Web Vital', {
        name,
        value: delta,
        id
      });
    };
    
    // Monitor Core Web Vitals
    onCLS(reportVital);
    onFID(reportVital);
    onLCP(reportVital);
  }, []);
  
  return null; // This component doesn't render anything
}

// Include in root layout
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <WebVitalsReporter />
      </body>
    </html>
  );
}
```

### 8.4 Strategic Quality Assessment

✅ **Performance targets align with business objectives**

✅ **Server Components are used appropriately for performance optimization**

✅ **Image and asset optimization follows best practices**

✅ **Performance monitoring is integrated into implementation**

✅ **Code splitting and lazy loading are implemented strategically**

## 9. Accessibility Implementation

### 9.1 WCAG Compliance Targets

- Minimum compliance level: **WCAG 2.1 Level AA**
- Target compliance level: **WCAG 2.1 Level AAA** for priority features

### 9.2 Implementation Patterns

#### Accessible Modal Dialog

```tsx
// ✅ GOOD: Accessible modal implementation
'use client';

import { useRef, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

export function Modal({ isOpen, onClose, title, children }) {
  const prefersReducedMotion = useReducedMotion();
  
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  // Return focus to previous element when closed
  const previousFocusRef = useRef();
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
      initialFocus={undefined}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      
      {/* Full-screen container for centering */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          as={motion.div}
          initial={!prefersReducedMotion ? { opacity: 0, scale: 0.95 } : undefined}
          animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md rounded-lg bg-wild-black p-6"
        >
          <Dialog.Title className="text-headline font-display text-hype-white">
            {title}
          </Dialog.Title>
          
          <div className="mt-4">
            {children}
          </div>
          
          <button
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100"
            onClick={onClose}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
```

#### Accessible Form with Error Handling

```tsx
// ✅ GOOD: Accessible form implementation
'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { submitBattleEntry } from '@/lib/actions';

export function BattleEntryForm({ battleId }) {
  const [state, formAction] = useFormState(submitBattleEntry, {
    errors: {},
    success: false
  });
  
  return (
    <form action={formAction} noValidate className="space-y-4">
      <input type="hidden" name="battleId" value={battleId} />
      
      <div>
        <label 
          htmlFor="title" 
          className="block mb-1 font-medium"
        >
          Entry Title <span aria-hidden="true" className="text-roast-red">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          aria-required="true"
          aria-invalid={Boolean(state.errors?.title)}
          aria-describedby={state.errors?.title ? "title-error" : undefined}
          className={`w-full rounded-md bg-zinc-900 border ${
            state.errors?.title ? 'border-roast-red' : 'border-zinc-700'
          } px-3 py-2`}
        />
        {state.errors?.title && (
          <p 
            id="title-error" 
            className="text-roast-red text-sm mt-1"
            aria-live="polite"
          >
            {state.errors.title}
          </p>
        )}
      </div>
      
      <div>
        <label 
          htmlFor="content" 
          className="block mb-1 font-medium"
        >
          Entry Content <span aria-hidden="true" className="text-roast-red">*</span>
        </label>
        <textarea
          id="content"
          name="content"
          rows={5}
          required
          aria-required="true"
          aria-invalid={Boolean(state.errors?.content)}
          aria-describedby={state.errors?.content ? "content-error" : undefined}
          className={`w-full rounded-md bg-zinc-900 border ${
            state.errors?.content ? 'border-roast-red' : 'border-zinc-700'
          } px-3 py-2`}
        />
        {state.errors?.content && (
          <p 
            id="content-error" 
            className="text-roast-red text-sm mt-1"
            aria-live="polite"
          >
            {state.errors.content}
          </p>
        )}
      </div>
      
      {/* Form-level error */}
      {state.errors?.form && (
        <div 
          className="p-3 bg-roast-red/10 border border-roast-red rounded-md text-roast-red"
          role="alert"
        >
          {state.errors.form}
        </div>
      )}
      
      {/* Success message */}
      {state.success && (
        <div 
          className="p-3 bg-victory-green/10 border border-victory-green rounded-md text-victory-green"
          role="status"
        >
          Your entry has been submitted successfully!
        </div>
      )}
      
      <div>
        <button
          type="submit"
          className="bg-battle-yellow text-wild-black px-4 py-2 rounded-md font-medium"
        >
          Submit Entry
        </button>
      </div>
    </form>
  );
}
```

### 9.3 Testing and Validation

```tsx
// ✅ GOOD: Accessibility testing implementation
// Component test with axe
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BattleCard } from './BattleCard';

expect.extend(toHaveNoViolations);

describe('BattleCard', () => {
  it('should not have accessibility violations', async () => {
    const mockBattle = {
      id: 'battle-123',
      title: 'Wild Style Battle',
      status: 'active',
      participants: 42,
      endTime: new Date(Date.now() + 3600000),
    };
    
    const { container } = render(<BattleCard battle={mockBattle} />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('renders battle information accessibly', () => {
    const mockBattle = {
      id: 'battle-123',
      title: 'Wild Style Battle',
      status: 'active',
      participants: 42,
      endTime: new Date(Date.now() + 3600000),
    };
    
    render(<BattleCard battle={mockBattle} />);
    
    // Check for proper heading
    expect(screen.getByRole('heading', { name: 'Wild Style Battle' })).toBeInTheDocument();
    
    // Check for status information
    expect(screen.getByText('active')).toBeInTheDocument();
    
    // Check for participants information
    expect(screen.getByText('42 participants')).toBeInTheDocument();
  });
});
```

### 9.4 Strategic Quality Assessment

✅ **Accessibility compliance targets are clearly defined**

✅ **Component implementations follow accessibility best practices**

✅ **Testing and validation processes are integrated into development**

✅ **Error handling and forms meet accessibility requirements**

✅ **Animation respects user preferences for reduced motion**

## 10. Risk Assessment and Mitigation

### 10.1 Key Frontend Risks

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| **Performance Degradation** | High | High | • Implement performance budgets<br>• Add performance testing in CI<br>• Use Server Components by default<br>• Optimize assets and code splitting | 
| **Inconsistent User Experience** | High | Medium | • Enforce component library usage<br>• Implement visual regression testing<br>• Create clear design guidelines<br>• Regular UX review process |
| **Authentication Vulnerabilities** | Medium | Critical | • Use established auth provider (Clerk)<br>• Implement proper CSRF protection<br>• Secure auth state management<br>• Regular security audits |
| **Mobile Experience Issues** | High | High | • Mobile-first development<br>• Test on representative devices<br>• Optimize for touch interfaces<br>• Performance focus for low-end devices |
| **Accessibility Compliance Failures** | High | Medium | • Automated a11y testing in CI<br>• Regular manual testing<br>• Clear accessibility requirements<br>• Training for developers |
| **Unstable Third-Party Dependencies** | Medium | High | • Limit external dependencies<br>• Pin version numbers<br>• Monitor for security updates<br>• Implement fallbacks where possible |
| **Lack of Browser Compatibility** | Medium | Medium | • Define browser support matrix<br>• Use automated browser testing<br>• Implement progressive enhancement<br>• Feature detection over user-agent sniffing |

### 10.2 Monitoring and Early Detection

**Performance Monitoring**
- Implement Core Web Vitals reporting to analytics
- Set up real user monitoring (RUM) for production
- Create performance dashboards with alerts
- Monitor client-side errors and exceptions

**User Experience Monitoring**
- Implement user journey tracking
- Monitor key conversion points (registration, battle participation)
- Collect feedback on UI/UX issues
- Analyze heatmaps and session recordings

**Accessibility Monitoring**
- Run periodic automated accessibility audits
- Implement user testing with assistive technologies
- Monitor accessibility-related issues in feedback
- Verify compliance on major updates

### 10.3 Strategic Quality Assessment

✅ **Key risks have been identified with clear likelihood and impact**

✅ **Mitigation strategies are specific and actionable**

✅ **Monitoring approach provides early detection of issues**

✅ **Risk assessment aligns with business objectives**

✅ **Contingency plans exist for critical failure scenarios**

## 11. Anti-Pattern Catalog

| Anti-Pattern | Example | Why It's Harmful | Better Approach |
|--------------|---------|------------------|----------------|
| **Client Component Overuse** | Adding 'use client' to all components | Increases bundle size, reduces performance | Default to Server Components, only add 'use client' when needed |
| **Prop Drilling** | Passing data through multiple component levels | Creates tight coupling and maintenance issues | Use composition, Context API, or Server Component nesting |
| **Inline Styles** | `<div style={{ color: 'red', marginTop: '10px' }}>` | Bypasses design system, creates inconsistency | Use Tailwind utility classes or component variants |
| **Direct DOM Manipulation** | `document.querySelector('.menu').classList.add('open')` | Bypasses React's rendering model, creates bugs | Use React state and refs for DOM interactions |
| **API Routes for Server Components** | Creating API routes to fetch data in Server Components | Adds unnecessary network requests | Fetch data directly in Server Components |
| **State Management Complexity** | Using global state for component-specific concerns | Increases debugging difficulty, creates unnecessary dependencies | Keep state as local as possible, use context sparingly |
| **Large Component Files** | 500+ line components with multiple responsibilities | Makes maintenance difficult, reduces reusability | Follow single responsibility principle, break into smaller components |

### Anti-Pattern Examples

#### Client Component Overuse

```tsx
// ❌ BAD: Unnecessary client directive
'use client'; // 👎 Not needed here!

// This component doesn't use any client features
export function UserProfile({ name, avatar, bio }) {
  return (
    <div className="profile-card">
      <img src={avatar} alt={name} />
      <h2>{name}</h2>
      <p>{bio}</p>
    </div>
  );
}

// ✅ GOOD: Server Component by default
export function UserProfile({ name, avatar, bio }) {
  return (
    <div className="profile-card">
      <img src={avatar} alt={name} />
      <h2>{name}</h2>
      <p>{bio}</p>
    </div>
  );
}
```

#### Prop Drilling

```tsx
// ❌ BAD: Prop drilling
function BattlePage({ battleId }) {
  const battle = useBattle(battleId);
  
  return (
    <div>
      <BattleHeader 
        title={battle.title} 
        creator={battle.creator} 
        status={battle.status}
      />
      <BattleContent 
        description={battle.description}
        creator={battle.creator} // 👎 Same prop drilled again
        entries={battle.entries}
      />
      <BattleActions 
        battleId={battleId}
        status={battle.status} // 👎 Drilling continues
        creator={battle.creator} // 👎 And again
      />
    </div>
  );
}

// ✅ GOOD: Using composition or context
function BattlePage({ battleId }) {
  // Option 1: Server Component composition
  const battle = await fetchBattle(battleId);
  
  return (
    <div>
      <BattleHeader battle={battle} />
      <BattleContent battle={battle} />
      <BattleActions battleId={battleId} status={battle.status} />
    </div>
  );
}

// Option 2: Client Component with context
'use client';

function BattlePage({ initialBattle }) {
  return (
    <BattleProvider initialBattle={initialBattle}>
      <div>
        <BattleHeader />
        <BattleContent />
        <BattleActions />
      </div>
    </BattleProvider>
  );
}
```

### Strategic Quality Assessment

✅ **Anti-patterns are clearly identified with examples**

✅ **Better alternatives are provided for each anti-pattern**

✅ **Impact of anti-patterns on business goals is explained**

✅ **Anti-patterns cover key areas of frontend development**

✅ **Detection mechanisms exist for common anti-patterns**