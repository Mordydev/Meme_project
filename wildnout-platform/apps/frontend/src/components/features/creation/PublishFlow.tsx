'use client'

import React, { useState } from 'react'
import { ContentData } from '@/types/content'
import ContentPreview from './ContentPreview'
import { SubmitButton } from '@/hooks/useBattleForms'

interface PublishFlowProps {
  content: ContentData
  onPublish: (formData: FormData, isDraft: boolean) => void
  onSaveDraft: () => void
  onCancel: () => void
  isPending: boolean
  errorMessage?: string
  className?: string
}

export default function PublishFlow({
  content,
  onPublish,
  onSaveDraft,
  onCancel,
  isPending,
  errorMessage,
  className = '',
}: PublishFlowProps) {
  const [publishMode, setPublishMode] = useState<'draft' | 'publish'>('publish')
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onPublish(formData, publishMode === 'draft')
  }
  
  // Check if content has required fields
  const isValid = (): boolean => {
    // Title is required
    if (!content.title || content.title.trim().length < 3) {
      return false
    }
    
    // Context type is required
    if (!content.contextType) {
      return false
    }
    
    // If battle context, battleId is required
    if (content.contextType === 'battle' && !content.battleId) {
      return false
    }
    
    // Format-specific validations
    switch (content.type) {
      case 'text':
        return Boolean(content.body && content.body.trim().length > 0)
      case 'image':
      case 'audio':
      case 'video':
        return Boolean(content.mediaUrl)
      case 'mixed':
        return Boolean((content.body && content.body.trim().length > 0) || content.mediaUrl)
      default:
        return false
    }
  }
  
  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview column */}
        <div>
          <h2 className="text-xl font-display text-hype-white mb-4">Preview</h2>
          <ContentPreview content={content} />
        </div>
        
        {/* Publishing column */}
        <div>
          <h2 className="text-xl font-display text-hype-white mb-4">Ready to Publish?</h2>
          
          <form onSubmit={handleSubmit}>
            {/* Show the error message if there is one */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-roast-red/10 border border-roast-red rounded text-roast-red text-sm">
                {errorMessage}
              </div>
            )}
            
            {/* Confirmation section */}
            <div className="bg-zinc-800 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-medium text-hype-white mb-4">Publication Options</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="publish-option"
                    type="radio"
                    name="publishOption"
                    checked={publishMode === 'publish'}
                    onChange={() => setPublishMode('publish')}
                    className="w-4 h-4 text-battle-yellow focus:ring-battle-yellow bg-zinc-700 border-zinc-600"
                  />
                  <label htmlFor="publish-option" className="ml-2 text-sm font-medium text-hype-white">
                    Publish Now
                  </label>
                  <p className="ml-6 text-xs text-zinc-400">
                    Your content will be immediately visible to the community
                  </p>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="draft-option"
                    type="radio"
                    name="publishOption"
                    checked={publishMode === 'draft'}
                    onChange={() => setPublishMode('draft')}
                    className="w-4 h-4 text-flow-blue focus:ring-flow-blue bg-zinc-700 border-zinc-600"
                  />
                  <label htmlFor="draft-option" className="ml-2 text-sm font-medium text-hype-white">
                    Save as Draft
                  </label>
                  <p className="ml-6 text-xs text-zinc-400">
                    Save your work and publish later
                  </p>
                </div>
              </div>
              
              {content.contextType === 'battle' && (
                <div className="mt-4 p-3 bg-battle-yellow/10 border border-battle-yellow rounded text-sm">
                  <p className="text-battle-yellow">
                    <strong>Note:</strong> This content will be submitted as an entry to a battle. Once published, it cannot be edited.
                  </p>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-md"
                disabled={isPending}
              >
                Back to Editing
              </button>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onSaveDraft}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-md"
                  disabled={isPending}
                >
                  Save Locally
                </button>
                
                {publishMode === 'draft' ? (
                  <button
                    type="submit"
                    disabled={!isValid() || isPending}
                    className="px-6 py-2 bg-flow-blue hover:bg-flow-blue/90 text-hype-white font-medium rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPending ? 'Saving...' : 'Save as Draft'}
                  </button>
                ) : (
                  <SubmitButton>
                    {content.contextType === 'battle' ? 'Submit Entry' : 'Publish Now'}
                  </SubmitButton>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
