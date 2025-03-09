'use client'

import React from 'react'
import Image from 'next/image'
import { ContentData } from '@/types/content'

interface ContentPreviewProps {
  content: ContentData
  className?: string
}

export default function ContentPreview({
  content,
  className = '',
}: ContentPreviewProps) {
  const { title, type, body, mediaUrl, tags } = content
  
  // Format the creation date
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  
  // Render media content based on type
  const renderMedia = () => {
    if (!mediaUrl) return null
    
    switch (type) {
      case 'image':
        return (
          <div className="w-full relative aspect-video bg-zinc-900 overflow-hidden rounded-md">
            <Image
              src={mediaUrl}
              alt={title || 'Content image'}
              fill
              className="object-cover"
            />
          </div>
        )
        
      case 'audio':
        return (
          <div className="w-full p-4 bg-zinc-900 rounded-md">
            <audio controls className="w-full">
              <source src={mediaUrl} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )
        
      case 'video':
        return (
          <div className="w-full bg-zinc-900 rounded-md overflow-hidden">
            <video controls className="w-full">
              <source src={mediaUrl} />
              Your browser does not support the video element.
            </video>
          </div>
        )
        
      default:
        return mediaUrl ? (
          <div className="w-full p-4 bg-zinc-900 rounded-md">
            <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="text-flow-blue hover:underline">
              View attached media
            </a>
          </div>
        ) : null
    }
  }
  
  return (
    <div className={`rounded-lg overflow-hidden bg-zinc-800 ${className}`}>
      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-display text-hype-white mb-2">{title || 'Untitled'}</h2>
          <div className="flex items-center text-zinc-400 text-sm">
            <span>Preview • {formattedDate}</span>
            {content.contextType === 'battle' && (
              <span className="ml-2 bg-battle-yellow/20 text-battle-yellow px-2 py-0.5 rounded-full text-xs">
                Battle Entry
              </span>
            )}
          </div>
        </div>
        
        {/* Content body or media */}
        <div className="space-y-4">
          {type === 'image' || type === 'video' || type === 'audio' ? (
            <>
              {renderMedia()}
              {body && <p className="text-zinc-200 whitespace-pre-line">{body}</p>}
            </>
          ) : (
            <>
              {body && <p className="text-zinc-200 whitespace-pre-line">{body}</p>}
              {renderMedia()}
            </>
          )}
        </div>
        
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-zinc-700 rounded-full text-xs text-zinc-300">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Simulated engagement metrics */}
      <div className="bg-zinc-700/50 px-6 py-3 flex items-center gap-6 text-zinc-400 text-sm">
        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          <span>0 Likes</span>
        </div>
        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>0 Comments</span>
        </div>
        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>0 Shares</span>
        </div>
      </div>
    </div>
  )
}
