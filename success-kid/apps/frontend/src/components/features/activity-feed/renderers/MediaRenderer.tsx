'use client';

import React, { useState } from 'react';
import { MediaFeedItem } from '../types';

interface MediaRendererProps {
  item: MediaFeedItem;
  isCompact?: boolean;
}

/**
 * Renderer for media content type in feed
 */
export function MediaRenderer({
  item,
  isCompact = false
}: MediaRendererProps) {
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const { content } = item;
  const { mediaUrls, mediaType, title, description } = content;
  
  const handleMediaLoad = () => {
    setMediaLoaded(true);
  };
  
  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex < mediaUrls.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };
  
  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };
  
  return (
    <div>
      {/* Media Title */}
      {title && (
        <h2 className="font-semibold text-lg mb-2">{title}</h2>
      )}
      
      {/* Media Description */}
      {description && (
        <p className="text-muted-foreground mb-3">{description}</p>
      )}
      
      {/* Media Content */}
      {!isCompact && mediaUrls && mediaUrls.length > 0 && (
        <div className="relative mt-3 bg-muted rounded-md overflow-hidden">
          {/* Loading Placeholder */}
          {!mediaLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="animate-pulse flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-muted-foreground">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span className="text-xs text-muted-foreground mt-2">Loading media...</span>
              </div>
            </div>
          )}
          
          {/* Media Content */}
          {mediaType === 'image' ? (
            <div className="relative pt-[56.25%]">
              <img
                src={mediaUrls[activeIndex]}
                alt={title || 'Media content'}
                className={`absolute inset-0 w-full h-full object-contain ${mediaLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                onLoad={handleMediaLoad}
              />
            </div>
          ) : (
            <div className="relative pt-[56.25%]">
              <video
                src={mediaUrls[activeIndex]} 
                className={`absolute inset-0 w-full h-full object-contain ${mediaLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                controls
                onLoadedData={handleMediaLoad}
              />
            </div>
          )}
          
          {/* Navigation Controls for Multiple Media */}
          {mediaUrls.length > 1 && (
            <>
              {/* Navigation Buttons */}
              <div className="absolute inset-y-0 left-0 flex items-center">
                <button
                  className={`bg-black/30 text-white rounded-full p-1 m-2 ${activeIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/50'}`}
                  onClick={handlePrevMedia}
                  disabled={activeIndex === 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              </div>
              
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  className={`bg-black/30 text-white rounded-full p-1 m-2 ${activeIndex === mediaUrls.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/50'}`}
                  onClick={handleNextMedia}
                  disabled={activeIndex === mediaUrls.length - 1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
              
              {/* Indicator Dots */}
              <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1">
                {mediaUrls.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full ${index === activeIndex ? 'bg-white' : 'bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(index);
                    }}
                    aria-label={`Go to media ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Compact Media Preview */}
      {isCompact && mediaUrls && mediaUrls.length > 0 && (
        <div className="mt-2 text-sm text-primary">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {mediaUrls.length > 1 ? `${mediaUrls.length} ${mediaType === 'image' ? 'images' : 'videos'}` : `1 ${mediaType === 'image' ? 'image' : 'video'}`}
          </span>
        </div>
      )}
    </div>
  );
}

export default MediaRenderer;
