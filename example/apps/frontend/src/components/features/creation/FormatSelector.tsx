'use client'

import React from 'react'
import { ContentType } from '@/types/content'

interface FormatOption {
  value: ContentType
  label: string
  icon: React.ReactNode
  description: string
}

interface FormatSelectorProps {
  selectedFormat: ContentType | null
  onChange: (format: ContentType) => void
  availableFormats?: ContentType[]
  className?: string
}

export default function FormatSelector({
  selectedFormat,
  onChange,
  availableFormats = ['text', 'image', 'audio', 'video', 'mixed'],
  className = '',
}: FormatSelectorProps) {
  const formatOptions: FormatOption[] = [
    {
      value: 'text',
      label: 'Text',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7V4h16v3" />
          <path d="M9 20h6" />
          <path d="M12 4v16" />
        </svg>
      ),
      description: 'Share your thoughts, stories, jokes, or bars in text format.'
    },
    {
      value: 'image',
      label: 'Image',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
      description: 'Share photos, memes, or visual content with the community.'
    },
    {
      value: 'audio',
      label: 'Audio',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      ),
      description: 'Share your vocal skills, beats, or sound clips.'
    },
    {
      value: 'video',
      label: 'Video',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="2" y1="7" x2="7" y2="7" />
          <line x1="2" y1="17" x2="7" y2="17" />
          <line x1="17" y1="17" x2="22" y2="17" />
          <line x1="17" y1="7" x2="22" y2="7" />
        </svg>
      ),
      description: 'Share video clips, skits, or performances.'
    },
    {
      value: 'mixed',
      label: 'Mixed',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 8h10" />
          <path d="M9 12h6" />
          <path d="M9 16h2" />
          <path d="M5 8h2" />
          <path d="M5 12h2" />
          <path d="M5 16h2" />
        </svg>
      ),
      description: 'Combine text, images, audio, or video in a single post.'
    }
  ].filter(option => availableFormats.includes(option.value));

  return (
    <div className={`${className}`}>
      <h2 className="text-xl font-display text-hype-white mb-4">Choose Content Format</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {formatOptions.map((format) => (
          <button
            key={format.value}
            type="button"
            onClick={() => onChange(format.value)}
            className={`flex flex-col items-center p-4 rounded-lg transition-all ${
              selectedFormat === format.value
                ? 'bg-battle-yellow text-wild-black ring-2 ring-offset-2 ring-offset-wild-black ring-battle-yellow'
                : 'bg-zinc-800 text-hype-white hover:bg-zinc-700'
            }`}
          >
            <div className={`mb-3 ${selectedFormat === format.value ? 'text-wild-black' : 'text-battle-yellow'}`}>
              {format.icon}
            </div>
            <h3 className="text-lg font-medium mb-1">{format.label}</h3>
            <p className={`text-xs text-center ${selectedFormat === format.value ? 'text-wild-black/80' : 'text-zinc-400'}`}>
              {format.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
