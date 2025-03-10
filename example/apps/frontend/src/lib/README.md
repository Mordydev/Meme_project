# Wild 'n Out Meme Coin Platform - State Management Architecture

This document outlines the state management patterns used in the Wild 'n Out Meme Coin Platform.

## Core Patterns

### 1. Server Component Data Patterns

Server Components are used for data fetching with built-in caching and revalidation strategies. These patterns minimize client-side JavaScript and improve performance.

**Key files:**
- `lib/data/battles.ts` - Data fetching functions for battles
- `app/(platform)/battle/[id]/page.tsx` - Example of Server Component data fetching

**Core concepts:**
- Use React's `cache()` function to deduplicate requests
- Implement revalidation strategies with `next: { revalidate: seconds }`
- Handle errors and notFound cases appropriately
- Split complex pages into smaller Server Components with Suspense boundaries

Example usage:
```tsx
// In a Server Component:
import { getBattle } from '@/lib/data/battles'

export default async function BattlePage({ params }) {
  const battle = await getBattle(params.id)
  // Render UI with data
}
```

### 2. Client-Side State Management

Zustand is used for client-side state management with persistence where appropriate. It handles UI state, user preferences, and tracking data.

**Key files:**
- `lib/state/battle-store.ts` - Battle-related state management

**Core concepts:**
- Separate stores by domain (battle, user, content, etc.)
- Use TypeScript for type safety
- Implement persistence for relevant state
- Use selectors for derived state
- Keep state as minimal as possible

Example usage:
```tsx
// In a Client Component:
import { useBattleStore } from '@/lib/state/battle-store'

export function BattleComponent() {
  const { 
    viewedBattles, 
    addViewedBattle 
  } = useBattleStore()
  
  // Use state and actions
}
```

### 3. Form Handling with Server Actions

Form handling is implemented using React's server actions with validation and error handling.

**Key files:**
- `lib/actions/battle-actions.ts` - Server actions for battle-related forms
- `hooks/useBattleForms.ts` - Custom hooks for form handling
- `components/features/battle/battle-actions/battle-entry-form.tsx` - Example form implementation

**Core concepts:**
- Use Zod for schema validation
- Implement server actions with proper error handling
- Create custom hooks for form state management
- Use optimistic updates for better UX
- Implement form components with accessibility in mind

Example usage:
```tsx
// In a Client Component:
import { useBattleEntryForm, SubmitButton } from '@/hooks/useBattleForms'

export function EntryForm({ battleId }) {
  const { state, formAction } = useBattleEntryForm(battleId)
  
  return (
    <form action={formAction}>
      {/* Form fields */}
      {state.errors?.form && (
        <div className="error">{state.errors.form}</div>
      )}
      <SubmitButton>Submit</SubmitButton>
    </form>
  )
}
```

## State Classification

| State Type | Storage Method | Example Use Cases |
|------------|----------------|------------------|
| **Server State** | Server Components + React Cache | API data, database content |
| **UI State** | Zustand (non-persisted) | Modal visibility, tab selection, view modes |
| **User Preferences** | Zustand (persisted) | Theme preference, display options |
| **Form State** | React useFormState | Input values, validation errors |
| **Authentication State** | Clerk | User authentication status |
| **Navigation State** | Next.js Router | Current route, navigation history |

## Best Practices

1. **Default to Server Components** - Use Server Components for data fetching and static content rendering.

2. **Minimize Client Components** - Only use Client Components when you need interactivity or hooks.

3. **Isolate Client/Server Boundaries** - Create clear boundaries between Server and Client Components.

4. **Progressive Enhancement** - Build with a server-first approach and enhance with client interactivity.

5. **State Colocation** - Keep state as close as possible to where it's used.

6. **Avoid Prop Drilling** - Use composition patterns or context for deeply nested components.

7. **Error Handling** - Implement proper error handling at each layer.

8. **Validation** - Validate data both on the client and server.

9. **Performance Optimization** - Use React.memo, useMemo, and useCallback in Client Components when necessary.

10. **Accessibility** - Ensure all forms and interactive elements are fully accessible.
