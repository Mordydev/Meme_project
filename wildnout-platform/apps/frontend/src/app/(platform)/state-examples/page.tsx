import { Suspense } from 'react'
import { getBattles } from '@/lib/data/battles'
import { StateManagementExample } from '@/components/features/battle/battle-examples/state-management-example'

/**
 * Example page to demonstrate various state management patterns
 */
export default async function StateExamplesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display text-hype-white mb-6">
        State Management Patterns
      </h1>
      
      <p className="text-hype-white/70 mb-6 max-w-3xl">
        This page demonstrates the different state management patterns used throughout 
        the Wild 'n Out platform. It shows how Server Components, Client Components, 
        Zustand stores, and Server Actions work together.
      </p>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-display text-hype-white mb-4">
            1. Server Component Data Fetching
          </h2>
          <p className="text-hype-white/70 mb-4 max-w-3xl">
            Server Components fetch data on the server and pass it to Client Components.
            This example fetches a list of battles using React's cache() function.
          </p>
          
          <Suspense fallback={<div className="h-60 bg-zinc-800 animate-pulse rounded-lg"></div>}>
            <BattleExampleSection />
          </Suspense>
        </section>
        
        <section>
          <h2 className="text-2xl font-display text-hype-white mb-4">
            2. Form Handling with Server Actions
          </h2>
          <p className="text-hype-white/70 mb-4 max-w-3xl">
            Server Actions provide type-safe form handling with server-side validation.
            See the "Battle Entry Form" for an example implementation.
          </p>
          
          <div className="p-5 border border-zinc-800 rounded-lg bg-zinc-900/50">
            <p className="text-hype-white">
              Check the entry form implementation in:
            </p>
            <ul className="list-disc list-inside text-hype-white/70 mt-2 space-y-1">
              <li>src/lib/actions/battle-actions.ts</li>
              <li>src/hooks/useBattleForms.ts</li>
              <li>src/components/features/battle/battle-actions/battle-entry-form.tsx</li>
            </ul>
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-display text-hype-white mb-4">
            3. Client-Side State with Zustand
          </h2>
          <p className="text-hype-white/70 mb-4 max-w-3xl">
            Zustand provides simple, flexible state management with persistence.
            The battle store tracks user preferences and activity.
          </p>
          
          <div className="p-5 border border-zinc-800 rounded-lg bg-zinc-900/50">
            <p className="text-hype-white">
              Check the store implementation in:
            </p>
            <ul className="list-disc list-inside text-hype-white/70 mt-2">
              <li>src/lib/state/battle-store.ts</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

/**
 * Server Component to fetch battle data
 */
async function BattleExampleSection() {
  // Fetch a battle from the API
  const battles = await getBattles({ limit: 1 });
  
  if (!battles || battles.length === 0) {
    return (
      <div className="p-6 border border-zinc-800 rounded-lg bg-zinc-900/50">
        <p className="text-hype-white/70">
          No battles available. Please create a battle first.
        </p>
      </div>
    );
  }
  
  // Pass the battle data to the client component
  return <StateManagementExample battle={battles[0]} />
}
