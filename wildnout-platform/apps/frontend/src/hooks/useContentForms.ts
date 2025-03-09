'use client'

import { useState, useTransition } from 'react'
import { useFormState } from 'react-dom'
import { ContentData, ContentDraft, ContentType } from '@/types/content'
import { createContent, updateContent, deleteContent } from '@/lib/actions/content-actions'
import { useEffect } from 'react'

// Key for local storage
const DRAFT_STORAGE_KEY = 'wno-content-drafts'

/**
 * Custom hook for content creation form
 */
export function useContentCreationForm(initialData?: ContentData) {
  // Initial state for the form
  const initialState = {
    success: false,
    errors: {},
    contentId: '',
    isDraft: false
  }
  
  // Form state using the server action
  const [state, formAction] = useFormState(createContent, initialState)
  
  // Optimistic UI update state
  const [isPending, startTransition] = useTransition()
  const [contentData, setContentData] = useState<ContentData>(initialData || {
    title: '',
    type: 'text',
    body: '',
    mediaUrl: '',
    additionalMedia: [],
    tags: [],
    contextType: 'community',
    status: 'published'
  })
  
  // Handle form submission with optimistic updates
  const handleSubmit = (formData: FormData, isDraft: boolean = false) => {
    // Set draft status
    formData.set('status', isDraft ? 'draft' : 'published')
    
    // Update optimistic state
    const updatedData: ContentData = {
      title: formData.get('title') as string,
      type: formData.get('type') as ContentType,
      body: formData.get('body') as string || '',
      mediaUrl: formData.get('mediaUrl') as string || '',
      additionalMedia: Array.from(formData.getAll('additionalMedia')) as string[],
      tags: Array.from(formData.getAll('tags')) as string[],
      contextType: formData.get('contextType') as 'battle' | 'community',
      battleId: formData.get('battleId') as string || undefined,
      status: isDraft ? 'draft' : 'published'
    }
    
    setContentData(updatedData)
    
    // Submit form
    startTransition(() => {
      formAction(formData)
    })
  }
  
  // Handle saving draft locally
  const saveDraftLocally = (data: ContentData): string => {
    try {
      // Get existing drafts
      const existingDraftsJson = localStorage.getItem(DRAFT_STORAGE_KEY) || '[]'
      const existingDrafts: ContentDraft[] = JSON.parse(existingDraftsJson)
      
      // Create new draft
      const draftId = `draft-${Date.now()}`
      const newDraft: ContentDraft = {
        ...data,
        draftId,
        lastEdited: new Date().toISOString()
      }
      
      // Add to drafts and save
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify([newDraft, ...existingDrafts]))
      
      return draftId
    } catch (error) {
      console.error('Error saving draft locally:', error)
      return ''
    }
  }
  
  // Function to handle auto-saving
  const saveAsDraft = (data: ContentData) => {
    saveDraftLocally(data)
    return true
  }
  
  return {
    state,
    formAction,
    contentData,
    setContentData,
    isPending,
    handleSubmit,
    saveAsDraft
  }
}

/**
 * Custom hook for content update form
 */
export function useContentUpdateForm(contentId: string, initialData: ContentData) {
  // Initial state for the form
  const initialState = {
    success: false,
    errors: {},
    contentId: contentId,
    isDraft: initialData.status === 'draft'
  }
  
  // Form state using the server action
  const [state, formAction] = useFormState(updateContent, initialState)
  
  // Optimistic UI update state
  const [isPending, startTransition] = useTransition()
  const [contentData, setContentData] = useState<ContentData>(initialData)
  
  // Handle form submission with optimistic updates
  const handleSubmit = (formData: FormData, isDraft: boolean = initialData.status === 'draft') => {
    // Set content ID and draft status
    formData.set('contentId', contentId)
    formData.set('status', isDraft ? 'draft' : 'published')
    
    // Update optimistic state
    const updatedData: ContentData = {
      title: formData.get('title') as string,
      type: formData.get('type') as ContentType,
      body: formData.get('body') as string || '',
      mediaUrl: formData.get('mediaUrl') as string || '',
      additionalMedia: Array.from(formData.getAll('additionalMedia')) as string[],
      tags: Array.from(formData.getAll('tags')) as string[],
      contextType: formData.get('contextType') as 'battle' | 'community',
      battleId: formData.get('battleId') as string || undefined,
      status: isDraft ? 'draft' : 'published'
    }
    
    setContentData(updatedData)
    
    // Submit form
    startTransition(() => {
      formAction(formData)
    })
  }
  
  return {
    state,
    formAction,
    contentData,
    setContentData,
    isPending,
    handleSubmit
  }
}

/**
 * Custom hook for content deletion
 */
export function useContentDeletion(onSuccess?: () => void) {
  // Initial state for the form
  const initialState = {
    success: false,
    errors: {}
  }
  
  // Form state using the server action
  const [state, formAction] = useFormState(deleteContent, initialState)
  
  // Optimistic UI update state
  const [isPending, startTransition] = useTransition()
  
  // Handle deletion with optimistic updates
  const handleDelete = (contentId: string) => {
    const formData = new FormData()
    formData.set('contentId', contentId)
    
    // Submit form
    startTransition(() => {
      formAction(formData)
    })
  }
  
  // Call onSuccess when deletion is successful
  useEffect(() => {
    if (state.success && onSuccess) {
      onSuccess()
    }
  }, [state.success, onSuccess])
  
  return {
    state,
    isPending,
    handleDelete
  }
}

/**
 * Custom hook for managing draft content
 */
export function useDraftManagement() {
  const [drafts, setDrafts] = useState<ContentDraft[]>([])
  
  // Load drafts on mount
  useEffect(() => {
    try {
      const draftsJson = localStorage.getItem(DRAFT_STORAGE_KEY) || '[]'
      const loadedDrafts: ContentDraft[] = JSON.parse(draftsJson)
      setDrafts(loadedDrafts)
    } catch (error) {
      console.error('Error loading drafts:', error)
      setDrafts([])
    }
  }, [])
  
  // Function to get a specific draft
  const getDraft = (draftId: string): ContentDraft | undefined => {
    return drafts.find(draft => draft.draftId === draftId)
  }
  
  // Function to delete a draft
  const deleteDraft = (draftId: string): boolean => {
    try {
      const updatedDrafts = drafts.filter(draft => draft.draftId !== draftId)
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updatedDrafts))
      setDrafts(updatedDrafts)
      return true
    } catch (error) {
      console.error('Error deleting draft:', error)
      return false
    }
  }
  
  // Function to update a draft
  const updateDraft = (draftId: string, data: Partial<ContentData>): boolean => {
    try {
      const draftIndex = drafts.findIndex(draft => draft.draftId === draftId)
      
      if (draftIndex === -1) return false
      
      const updatedDraft: ContentDraft = {
        ...drafts[draftIndex],
        ...data,
        lastEdited: new Date().toISOString()
      }
      
      const updatedDrafts = [...drafts]
      updatedDrafts[draftIndex] = updatedDraft
      
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updatedDrafts))
      setDrafts(updatedDrafts)
      
      return true
    } catch (error) {
      console.error('Error updating draft:', error)
      return false
    }
  }
  
  return {
    drafts,
    getDraft,
    deleteDraft,
    updateDraft
  }
}
