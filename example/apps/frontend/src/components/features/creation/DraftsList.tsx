'use client'

import React from 'react'
import { ContentDraft } from '@/types/content'
import { useDraftManagement } from '@/hooks/useContentForms'

interface DraftsListProps {
  onEditDraft: (draftId: string) => void
  className?: string
}

export default function DraftsList({
  onEditDraft,
  className = '',
}: DraftsListProps) {
  const { drafts, deleteDraft } = useDraftManagement()
  
  // Format relative time
  const getRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }
  
  if (drafts.length === 0) {
    return (
      <div className={`rounded-lg bg-zinc-800 p-6 ${className}`}>
        <h3 className="text-xl font-display text-hype-white mb-4">Your Drafts</h3>
        <div className="text-center py-6 text-zinc-400">
          <p>You don't have any saved drafts yet.</p>
          <p className="text-sm mt-2">When you save content as a draft, it will appear here.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`rounded-lg bg-zinc-800 p-6 ${className}`}>
      <h3 className="text-xl font-display text-hype-white mb-4">Your Drafts</h3>
      
      <div className="space-y-1">
        {drafts.map((draft) => (
          <div 
            key={draft.draftId} 
            className="border-b border-zinc-700 py-4 last:border-0 last:pb-0"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-hype-white font-medium">
                  {draft.title || 'Untitled Draft'}
                </h4>
                <div className="flex items-center space-x-2 text-xs text-zinc-400">
                  <span>Last edited {getRelativeTime(draft.lastEdited)}</span>
                  <span>•</span>
                  <span className="capitalize">{draft.type || 'text'}</span>
                  {draft.contextType === 'battle' && (
                    <>
                      <span>•</span>
                      <span className="bg-battle-yellow/20 text-battle-yellow px-1.5 py-0.5 rounded-full">
                        Battle Entry
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEditDraft(draft.draftId)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-hype-white text-sm px-3 py-1.5 rounded-md"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteDraft(draft.draftId)}
                  className="bg-zinc-700 hover:bg-roast-red/70 text-hype-white text-sm px-3 py-1.5 rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-2 text-zinc-300 text-sm line-clamp-1">
              {draft.body || 'No content preview available'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
