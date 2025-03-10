'use client'

import React, { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

interface MediaUploaderProps {
  initialUrl?: string
  onMediaChange: (url: string) => void
  label?: string
  accept?: string
  maxSize?: number // in MB
  className?: string
}

export default function MediaUploader({
  initialUrl = '',
  onMediaChange,
  label = 'Media',
  accept = 'image/*',
  maxSize = 5, // 5MB default
  className = '',
}: MediaUploaderProps) {
  const [mediaUrl, setMediaUrl] = useState<string>(initialUrl)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // This would use a real upload service in production
  const handleUpload = useCallback(async (file: File) => {
    // Reset error state
    setError('')
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`)
      return
    }
    
    try {
      setIsUploading(true)
      
      // In a real app, this would upload to a server/CDN
      // For now, we'll use a local URL to simulate
      const url = URL.createObjectURL(file)
      
      // Simulate upload delay
      await new Promise(r => setTimeout(r, 1000))
      
      setMediaUrl(url)
      onMediaChange(url)
    } catch (error) {
      console.error('Upload error:', error)
      setError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [maxSize, onMediaChange])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }, [handleUpload])

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const removeMedia = () => {
    setMediaUrl('')
    onMediaChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <label className="block text-zinc-300 text-sm font-medium mb-2">
        {label}
      </label>
      
      {mediaUrl ? (
        <div className="relative rounded-md overflow-hidden bg-zinc-800">
          {accept.includes('image/') ? (
            <div className="aspect-video relative">
              <Image 
                src={mediaUrl} 
                alt="Uploaded media"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="p-4 text-hype-white">
              Media uploaded successfully
            </div>
          )}
          
          <div className="absolute bottom-2 right-2 flex space-x-2">
            <button
              type="button"
              onClick={triggerFileSelect}
              className="bg-zinc-700 hover:bg-zinc-600 text-hype-white text-xs px-2 py-1 rounded"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={removeMedia}
              className="bg-roast-red hover:bg-roast-red/80 text-hype-white text-xs px-2 py-1 rounded"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed ${
            isDragging ? 'border-battle-yellow bg-battle-yellow/10' : 'border-zinc-700'
          } rounded-md p-6 text-center transition-colors duration-200`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-10 h-10 border-4 border-zinc-600 border-t-battle-yellow rounded-full animate-spin mb-4"></div>
              <p className="text-zinc-400">Uploading...</p>
            </div>
          ) : (
            <>
              <div className="text-zinc-400 mb-2">
                Drag and drop files here, or click to select files
              </div>
              <button 
                type="button"
                className="bg-zinc-700 hover:bg-zinc-600 text-hype-white font-medium px-4 py-2 rounded-md"
              >
                Select Files
              </button>
              
              {error && (
                <div className="mt-2 text-roast-red text-sm">
                  {error}
                </div>
              )}
              
              <div className="mt-2 text-zinc-500 text-xs">
                {accept.includes('image/') ? 'Images' : 'Files'} up to {maxSize}MB
              </div>
            </>
          )}
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={accept}
        className="hidden"
        aria-label={`Upload ${label}`}
      />
      
      {/* Hidden input to store the media URL for form submission */}
      <input type="hidden" name="mediaUrl" value={mediaUrl} />
    </div>
  )
}
