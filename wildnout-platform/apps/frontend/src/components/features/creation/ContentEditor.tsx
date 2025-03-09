'use client'

import React, { useState, useEffect } from 'react'
import { ContentData, ContentType, BattleRules } from '@/types/content'
import MediaUploader from './MediaUploader'

interface ContentEditorProps {
  initialContent?: ContentData
  format: ContentType
  context?: 'battle' | 'community'
  battleRules?: BattleRules
  onChange: (content: ContentData) => void
  className?: string
}

export default function ContentEditor({
  initialContent = {},
  format,
  context = 'community',
  battleRules,
  onChange,
  className = '',
}: ContentEditorProps) {
  const [content, setContent] = useState<ContentData>({
    title: initialContent.title || '',
    type: format,
    body: initialContent.body || '',
    mediaUrl: initialContent.mediaUrl || '',
    additionalMedia: initialContent.additionalMedia || [],
    tags: initialContent.tags || [],
    contextType: context,
    battleId: initialContent.battleId,
  })
  
  // Auto-save timer
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Update content when props change
  useEffect(() => {
    setContent(prev => ({
      ...prev,
      type: format,
      contextType: context,
      battleId: initialContent.battleId,
    }))
  }, [format, context, initialContent.battleId])
  
  // Notify parent of content changes
  useEffect(() => {
    onChange(content)
    setLastSaved(new Date())
  }, [content, onChange])
  
  // Handle text content change
  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(prev => ({
      ...prev,
      body: e.target.value
    }))
  }
  
  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(prev => ({
      ...prev,
      title: e.target.value
    }))
  }
  
  // Handle media change
  const handleMediaChange = (url: string) => {
    setContent(prev => ({
      ...prev,
      mediaUrl: url
    }))
  }
  
  // Handle tags change
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value
    const tagsArray = tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    setContent(prev => ({
      ...prev,
      tags: tagsArray
    }))
  }
  
  // Check if content is valid based on format
  const isContentValid = (): boolean => {
    // Title is always required
    if (!content.title || content.title.trim().length < 3) {
      return false
    }
    
    // Format-specific validations
    switch (format) {
      case 'text':
        return Boolean(content.body && content.body.trim().length > 0)
      case 'image':
        return Boolean(content.mediaUrl)
      case 'audio':
        return Boolean(content.mediaUrl)
      case 'video':
        return Boolean(content.mediaUrl)
      case 'mixed':
        return Boolean((content.body && content.body.trim().length > 0) || content.mediaUrl)
      default:
        return false
    }
  }
  
  // Check if we're exceeding any battle rules
  const getBattleRuleViolations = (): string[] => {
    const violations: string[] = []
    
    if (!battleRules || context !== 'battle') {
      return violations
    }
    
    // Check media type restrictions
    if (battleRules.mediaTypes && !battleRules.mediaTypes.includes(format)) {
      violations.push(`This battle only accepts: ${battleRules.mediaTypes.join(', ')}`)
    }
    
    // Check length restrictions for text
    if (content.body) {
      if (battleRules.minLength && content.body.length < battleRules.minLength) {
        violations.push(`Minimum length: ${battleRules.minLength} characters`)
      }
      
      if (battleRules.maxLength && content.body.length > battleRules.maxLength) {
        violations.push(`Maximum length: ${battleRules.maxLength} characters`)
      }
    }
    
    return violations
  }
  
  // Get battle rule violations
  const ruleViolations = getBattleRuleViolations()
  
  // Render editor based on content format
  const renderFormatEditor = () => {
    switch (format) {
      case 'text':
        return (
          <div>
            <textarea
              value={content.body || ''}
              onChange={handleBodyChange}
              rows={8}
              className="w-full px-4 py-3 bg-zinc-700 text-hype-white rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-battle-yellow"
              placeholder="Share your thoughts, jokes, or bars..."
            ></textarea>
            
            {battleRules?.maxLength && (
              <div className="mt-1 text-xs text-zinc-400 flex justify-end">
                <span className={content.body && battleRules.maxLength < content.body.length ? 'text-roast-red' : ''}>
                  {content.body?.length || 0}/{battleRules.maxLength} characters
                </span>
              </div>
            )}
          </div>
        );
        
      case 'image':
        return (
          <MediaUploader
            initialUrl={content.mediaUrl}
            onMediaChange={handleMediaChange}
            label="Image"
            accept="image/*"
          />
        );
        
      case 'audio':
        return (
          <MediaUploader
            initialUrl={content.mediaUrl}
            onMediaChange={handleMediaChange}
            label="Audio"
            accept="audio/*"
          />
        );
        
      case 'video':
        return (
          <MediaUploader
            initialUrl={content.mediaUrl}
            onMediaChange={handleMediaChange}
            label="Video"
            accept="video/*"
          />
        );
        
      case 'mixed':
        return (
          <div className="space-y-6">
            <textarea
              value={content.body || ''}
              onChange={handleBodyChange}
              rows={5}
              className="w-full px-4 py-3 bg-zinc-700 text-hype-white rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-battle-yellow"
              placeholder="Add some text to your media (optional)..."
            ></textarea>
            
            <MediaUploader
              initialUrl={content.mediaUrl}
              onMediaChange={handleMediaChange}
              label="Media (Image, Audio, or Video)"
              accept="image/*,audio/*,video/*"
            />
          </div>
        );
        
      default:
        return <div>Select a content format to begin.</div>;
    }
  }
  
  return (
    <div className={`${className}`}>
      <div className="space-y-6">
        <div>
          <label className="block text-zinc-300 text-sm font-medium mb-2" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={content.title || ''}
            onChange={handleTitleChange}
            className="w-full px-4 py-3 bg-zinc-700 text-hype-white rounded-md focus:outline-none focus:ring-2 focus:ring-battle-yellow"
            placeholder="Give your content a title"
          />
        </div>
        
        <div>
          <label className="block text-zinc-300 text-sm font-medium mb-2">
            Content
          </label>
          {renderFormatEditor()}
        </div>
        
        <div>
          <label className="block text-zinc-300 text-sm font-medium mb-2" htmlFor="tags">
            Tags (optional)
          </label>
          <input
            id="tags"
            type="text"
            value={content.tags?.join(', ') || ''}
            onChange={handleTagsChange}
            className="w-full px-4 py-3 bg-zinc-700 text-hype-white rounded-md focus:outline-none focus:ring-2 focus:ring-battle-yellow"
            placeholder="Add tags separated by commas (e.g., funny, freestyle, reaction)"
          />
          <div className="mt-1 text-xs text-zinc-400">
            Add relevant tags to help others find your content
          </div>
        </div>
        
        {/* Battle rule violations */}
        {ruleViolations.length > 0 && (
          <div className="p-3 bg-roast-red/10 border border-roast-red rounded text-roast-red text-sm">
            <div className="font-medium mb-1">Battle Rules Violation:</div>
            <ul className="list-disc pl-5 space-y-1">
              {ruleViolations.map((violation, index) => (
                <li key={index}>{violation}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Auto-save indicator */}
        {lastSaved && (
          <div className="text-xs text-zinc-500 text-right">
            Last saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}
        
        {/* Hidden inputs for form submission */}
        <input type="hidden" name="type" value={content.type || ''} />
        <input type="hidden" name="body" value={content.body || ''} />
        <input type="hidden" name="contextType" value={content.contextType || ''} />
        <input type="hidden" name="battleId" value={content.battleId || ''} />
        
        {/* Tags as hidden inputs for form submission */}
        {content.tags?.map((tag, index) => (
          <input key={index} type="hidden" name="tags" value={tag} />
        ))}
        
        {/* Additional media as hidden inputs */}
        {content.additionalMedia?.map((media, index) => (
          <input key={index} type="hidden" name="additionalMedia" value={media} />
        ))}
      </div>
    </div>
  )
}
