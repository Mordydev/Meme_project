'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ContentData, ContentType } from '@/types/content'
import { Battle } from '@/types/battle'
import FormatSelector from './FormatSelector'
import ContextSelector from './ContextSelector'
import ContentEditor from './ContentEditor'
import PublishFlow from './PublishFlow'
import { useContentCreationForm } from '@/hooks/useContentForms'

interface ContentCreationProps {
  initialContext?: 'battle' | 'community'
  battleId?: string
  initialFormat?: ContentType
  availableBattles: Battle[]
  className?: string
}

export default function ContentCreation({
  initialContext,
  battleId,
  initialFormat,
  availableBattles,
  className = '',
}: ContentCreationProps) {
  // Stage of creation process
  const [stage, setStage] = useState<'format' | 'context' | 'edit' | 'publish'>('format')
  
  // Content format state
  const [format, setFormat] = useState<ContentType | null>(initialFormat || null)
  
  // Content context state
  const [context, setContext] = useState<'battle' | 'community' | null>(initialContext || null)
  const [selectedBattleId, setSelectedBattleId] = useState<string | null>(battleId || null)
  
  // Search params for potential query params
  const searchParams = useSearchParams()
  
  // Initialize with search params if available
  useEffect(() => {
    const paramFormat = searchParams.get('format') as ContentType | null
    const paramContext = searchParams.get('context') as 'battle' | 'community' | null
    const paramBattleId = searchParams.get('battleId')
    
    if (paramFormat && ['text', 'image', 'audio', 'video', 'mixed'].includes(paramFormat)) {
      setFormat(paramFormat)
      setStage('context')
    }
    
    if (paramContext) {
      setContext(paramContext)
      
      if (paramContext === 'battle' && paramBattleId) {
        setSelectedBattleId(paramBattleId)
      }
      
      if (format) {
        setStage('edit')
      }
    }
  }, [searchParams, format])
  
  // Use the content creation form
  const {
    state,
    contentData,
    setContentData,
    isPending,
    handleSubmit,
    saveAsDraft
  } = useContentCreationForm()
  
  // Get selected battle if any
  const selectedBattle = selectedBattleId 
    ? availableBattles.find(battle => battle.id === selectedBattleId)
    : null
  
  // Battle rules from selected battle
  const battleRules = selectedBattle ? {
    mediaTypes: selectedBattle.battleType === 'wildStyle' 
      ? ['text', 'image', 'audio', 'mixed']
      : ['text', 'image', 'video', 'mixed'],
    minLength: 10,
    maxLength: 500
  } : undefined
  
  // Handle format selection
  const handleFormatSelect = (selectedFormat: ContentType) => {
    setFormat(selectedFormat)
    setContentData(prev => ({ ...prev, type: selectedFormat }))
    setStage('context')
  }
  
  // Handle context selection
  const handleContextSelect = (selectedContext: 'battle' | 'community', battleId?: string) => {
    setContext(selectedContext)
    setSelectedBattleId(battleId || null)
    setContentData(prev => ({ 
      ...prev, 
      contextType: selectedContext,
      battleId: battleId
    }))
    setStage('edit')
  }
  
  // Handle content changes
  const handleContentChange = (updatedContent: ContentData) => {
    setContentData(updatedContent)
  }
  
  // Handle publish action
  const handlePublishFlow = () => {
    setStage('publish')
  }
  
  // Handle cancel publish
  const handleCancelPublish = () => {
    setStage('edit')
  }
  
  // Handle local save
  const handleLocalSave = () => {
    saveAsDraft(contentData)
    // Show a toast notification or feedback here
    // Then return to editing
    setStage('edit')
  }
  
  // Render current stage
  const renderStage = () => {
    switch (stage) {
      case 'format':
        return (
          <FormatSelector
            selectedFormat={format}
            onChange={handleFormatSelect}
            availableFormats={
              context === 'battle' && battleRules?.mediaTypes
                ? battleRules.mediaTypes
                : ['text', 'image', 'audio', 'video', 'mixed']
            }
          />
        )
        
      case 'context':
        return (
          <ContextSelector
            selectedContext={context}
            selectedBattleId={selectedBattleId}
            availableBattles={availableBattles}
            onChange={handleContextSelect}
          />
        )
        
      case 'edit':
        if (!format) return <div>Please select a format first</div>
        
        return (
          <div className="space-y-8">
            <ContentEditor
              initialContent={contentData}
              format={format}
              context={context || 'community'}
              battleRules={battleRules}
              onChange={handleContentChange}
            />
            
            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => saveAsDraft(contentData)}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-md"
              >
                Save Draft
              </button>
              
              <button
                type="button"
                onClick={handlePublishFlow}
                className="px-6 py-2 bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium rounded-md"
                disabled={!format || !context}
              >
                {context === 'battle' ? 'Review & Submit' : 'Review & Publish'}
              </button>
            </div>
          </div>
        )
        
      case 'publish':
        return (
          <PublishFlow
            content={contentData}
            onPublish={handleSubmit}
            onSaveDraft={handleLocalSave}
            onCancel={handleCancelPublish}
            isPending={isPending}
            errorMessage={state.errors?.form as string}
          />
        )
        
      default:
        return <div>Unknown stage</div>
    }
  }
  
  // Render progress indicator
  const renderProgress = () => {
    const stages = [
      { key: 'format', label: 'Format' },
      { key: 'context', label: 'Context' },
      { key: 'edit', label: context === 'battle' ? 'Create Entry' : 'Create Content' },
      { key: 'publish', label: context === 'battle' ? 'Submit' : 'Publish' },
    ]
    
    const currentIndex = stages.findIndex(s => s.key === stage)
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {stages.map((s, index) => (
            <React.Fragment key={s.key}>
              <div 
                className={`relative flex flex-col items-center ${
                  index <= currentIndex ? 'text-battle-yellow' : 'text-zinc-500'
                }`}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                  index <= currentIndex 
                    ? 'border-battle-yellow bg-battle-yellow/10' 
                    : 'border-zinc-500 bg-zinc-800'
                }`}>
                  {index < currentIndex ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className="mt-2 text-xs">{s.label}</span>
              </div>
              
              {index < stages.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  index < currentIndex ? 'bg-battle-yellow' : 'bg-zinc-700'
                }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className={`${className}`}>
      {renderProgress()}
      {renderStage()}
    </div>
  )
}
