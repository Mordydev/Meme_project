'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { BattleEntry } from '@/types/battle'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'

interface EntryDisplayProps {
  entry: BattleEntry
  compact?: boolean
}

export function EntryDisplay({
  entry,
  compact = false
}: EntryDisplayProps) {
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioMuted, setAudioMuted] = useState(false)
  
  // Calculate the first letter of creator name for avatar fallback
  const creatorInitial = entry.creatorName[0].toUpperCase()
  
  // Toggle audio playback
  const toggleAudio = () => {
    setAudioPlaying(!audioPlaying)
  }
  
  // Toggle audio mute
  const toggleMute = () => {
    setAudioMuted(!audioMuted)
  }
  
  return (
    <div className={`entry-display ${compact ? 'entry-display--compact' : ''}`}>
      {/* Creator info */}
      <div className="flex items-center mb-3">
        <Avatar className="h-8 w-8 mr-2">
          {entry.creatorAvatar ? (
            <AvatarImage src={entry.creatorAvatar} alt={entry.creatorName} />
          ) : (
            <AvatarFallback>{creatorInitial}</AvatarFallback>
          )}
        </Avatar>
        <span className="font-medium">{entry.creatorName}</span>
      </div>
      
      {/* Entry content based on type */}
      <div className="entry-content">
        {/* Text content */}
        {entry.content.body && (
          <div className="entry-text mb-3">
            <p className="text-hype-white whitespace-pre-wrap">
              {entry.content.body}
            </p>
          </div>
        )}
        
        {/* Image content */}
        {entry.content.type === 'image' && entry.content.mediaUrl && (
          <div className="entry-image mb-3 rounded-md overflow-hidden relative">
            <div className="aspect-video bg-zinc-900 flex items-center justify-center relative">
              <Image
                src={entry.content.mediaUrl}
                alt="Entry media"
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}
        
        {/* Audio content */}
        {entry.content.type === 'audio' && entry.content.mediaUrl && (
          <div className="entry-audio mb-3">
            <div className="bg-zinc-800 p-3 rounded-md flex items-center">
              <button 
                onClick={toggleAudio}
                className="size-10 flex items-center justify-center bg-zinc-700 rounded-full mr-3"
              >
                {audioPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>
              
              <div className="flex-1">
                <div className="h-2 bg-zinc-700 rounded-full">
                  <div 
                    className="h-full bg-battle-yellow rounded-full"
                    style={{ width: `${audioPlaying ? 45 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <button 
                onClick={toggleMute}
                className="size-8 flex items-center justify-center ml-3"
              >
                {audioMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Video content */}
        {entry.content.type === 'video' && entry.content.mediaUrl && (
          <div className="entry-video mb-3 rounded-md overflow-hidden">
            <div className="aspect-video bg-zinc-900 flex items-center justify-center">
              <div className="text-zinc-500 text-sm">Video Preview</div>
            </div>
          </div>
        )}
        
        {/* Mixed content - show additional media thumbnails */}
        {entry.content.type === 'mixed' && entry.content.additionalMedia && entry.content.additionalMedia.length > 0 && (
          <div className="entry-additional-media flex gap-2 mb-3">
            {entry.content.additionalMedia.map((media, index) => (
              <div 
                key={index}
                className="size-16 bg-zinc-800 rounded-md overflow-hidden"
              >
                {/* This would be an actual thumbnail in a real implementation */}
                <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                  Media {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
