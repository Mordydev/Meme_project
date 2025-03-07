'use client'

import { useState, useTransition } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { createBattle, submitBattleEntry, voteBattleEntry } from '@/lib/actions/battle-actions'

/**
 * Custom hook for battle creation form
 */
export function useBattleCreationForm() {
  // Initial state for the form
  const initialState = {
    success: false,
    errors: {}
  }
  
  // Form state using the server action
  const [state, formAction] = useFormState(createBattle, initialState)
  
  // Optimistic UI update state
  const [isPending, startTransition] = useTransition()
  const [optimisticState, setOptimisticState] = useState({
    title: '',
    description: '',
    battleType: '' as const
  })
  
  // Handle form submission with optimistic updates
  const handleSubmit = (formData: FormData) => {
    // Update optimistic state
    setOptimisticState({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      battleType: formData.get('battleType') as any
    })
    
    // Submit form
    startTransition(() => {
      formAction(formData)
    })
  }
  
  return {
    state,
    formAction,
    isPending,
    optimisticState,
    handleSubmit
  }
}

/**
 * Custom hook for battle entry submission form
 */
export function useBattleEntryForm(battleId: string) {
  // Initial state for the form
  const initialState = {
    success: false,
    errors: {}
  }
  
  // Form state using the server action
  const [state, formAction] = useFormState(submitBattleEntry, initialState)
  
  // Optimistic UI update state
  const [isPending, startTransition] = useTransition()
  const [optimisticState, setOptimisticState] = useState({
    content: {
      type: 'text' as const,
      body: '',
      mediaUrl: ''
    }
  })
  
  // Handle form submission with optimistic updates
  const handleSubmit = (formData: FormData) => {
    // Ensure the battleId is included
    formData.set('battleId', battleId)
    
    // Update optimistic state
    setOptimisticState({
      content: {
        type: formData.get('contentType') as 'text',
        body: formData.get('body') as string,
        mediaUrl: formData.get('mediaUrl') as string
      }
    })
    
    // Submit form
    startTransition(() => {
      formAction(formData)
    })
  }
  
  return {
    state,
    formAction,
    isPending,
    optimisticState,
    handleSubmit
  }
}

/**
 * Custom hook for battle voting form
 */
export function useBattleVotingForm(battleId: string) {
  // Initial state for the form
  const initialState = {
    success: false,
    errors: {}
  }
  
  // Form state using the server action
  const [state, formAction] = useFormState(voteBattleEntry, initialState)
  
  // Optimistic UI update state
  const [isPending, startTransition] = useTransition()
  const [optimisticVotedEntryId, setOptimisticVotedEntryId] = useState<string | null>(null)
  
  // Handle vote submission with optimistic updates
  const handleVote = (entryId: string) => {
    // Create a FormData object
    const formData = new FormData()
    formData.set('battleId', battleId)
    formData.set('entryId', entryId)
    
    // Update optimistic state
    setOptimisticVotedEntryId(entryId)
    
    // Submit form
    startTransition(() => {
      formAction(formData)
    })
  }
  
  return {
    state,
    isPending,
    optimisticVotedEntryId,
    handleVote
  }
}

/**
 * Form submit button component with loading state
 */
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="bg-battle-yellow text-wild-black px-4 py-2 rounded-md font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? 'Processing...' : children}
    </button>
  )
}
