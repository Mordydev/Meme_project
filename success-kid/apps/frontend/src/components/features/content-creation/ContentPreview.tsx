'use client';

import React from 'react';
import { ContentFormData } from '@/types/content-creation';
import { Button } from '@/components/ui/button';
import { 
  BarChart2, 
  Link as LinkIcon, 
  Calendar, 
  ArrowLeft, 
  MessageSquare, 
  ThumbsUp
} from 'lucide-react';

interface ContentPreviewProps {
  content: ContentFormData;
  onEdit: () => void;
  onPublish: () => void;
  categoryName?: string;
}

export function ContentPreview({ 
  content, 
  onEdit, 
  onPublish, 
  categoryName = 'Unknown Category' 
}: ContentPreviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{content.title}</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
            <span>Posted in {categoryName}</span>
            <span>•</span>
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Just now
            </span>
          </div>
        </div>
        
        <Button variant="ghost" onClick={onEdit}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Edit
        </Button>
      </div>
      
      {/* Link display for link type posts */}
      {content.type === 'link' && content.link && (
        <a 
          href={content.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block border rounded-lg p-4 hover:bg-gray-50"
        >
          <div className="flex items-center">
            <LinkIcon className="h-5 w-5 mr-2 text-gray-500" />
            <span className="text-primary underline">{content.link}</span>
          </div>
        </a>
      )}
      
      {/* Media gallery for image type posts */}
      {content.media.length > 0 && (
        <div className={`grid grid-cols-1 ${content.media.length > 1 ? 'sm:grid-cols-2' : ''} gap-4`}>
          {content.media.map((file, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <img src={file.previewUrl} alt="Preview" className="w-full h-auto" />
            </div>
          ))}
        </div>
      )}
      
      {/* Main content body */}
      {content.body && (
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content.body }}
        />
      )}
      
      {/* Poll display for poll type posts */}
      {content.type === 'poll' && content.pollOptions && content.pollOptions.length >= 2 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-xl font-semibold flex items-center">
            <BarChart2 className="h-5 w-5 mr-2" />
            Poll
          </h3>
          <div className="space-y-2">
            {content.pollOptions.filter(o => o.trim()).map((option, index) => (
              <div 
                key={index} 
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
              >
                <span>{option}</span>
                <span className="text-sm text-gray-500">0 votes</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">Poll will be active for 7 days after publishing</p>
        </div>
      )}
      
      {/* Tags */}
      {content.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {content.tags.map((tag, index) => (
            <div 
              key={index}
              className="bg-gray-200 rounded-full px-3 py-1 text-sm"
            >
              #{tag}
            </div>
          ))}
        </div>
      )}
      
      {/* Mock interaction toolbar */}
      <div className="border-t pt-4 mt-6">
        <div className="flex items-center space-x-4">
          <button className="flex items-center text-gray-500 hover:text-gray-700">
            <ThumbsUp className="h-5 w-5 mr-1" />
            <span>0</span>
          </button>
          <button className="flex items-center text-gray-500 hover:text-gray-700">
            <MessageSquare className="h-5 w-5 mr-1" />
            <span>0</span>
          </button>
        </div>
      </div>
      
      {/* Publishing action */}
      <div className="flex justify-end border-t pt-4">
        <Button 
          onClick={onPublish}
          className="px-6"
        >
          Publish Now
        </Button>
      </div>
    </div>
  );
}
