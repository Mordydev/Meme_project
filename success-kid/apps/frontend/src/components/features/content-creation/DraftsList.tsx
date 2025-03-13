'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDrafts } from '@/hooks/useDrafts';
import { formatDistanceToNow } from 'date-fns';
import { AlignLeft, Image, Link as LinkIcon, BarChart2, Trash2, Edit } from 'lucide-react';

// Mock user ID for testing
const MOCK_USER_ID = 'user_123';

export function DraftsList() {
  const { drafts, deleteDraft, isLoading } = useDrafts(MOCK_USER_ID);
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <AlignLeft className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'link':
        return <LinkIcon className="h-4 w-4" />;
      case 'poll':
        return <BarChart2 className="h-4 w-4" />;
      default:
        return <AlignLeft className="h-4 w-4" />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p>Loading drafts...</p>
      </div>
    );
  }
  
  if (drafts.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No drafts yet. Start creating content to see your drafts here!</p>
        <Link href="/community/create">
          <Button className="mt-4">Create New Post</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Drafts</h2>
      
      <div className="space-y-4">
        {drafts.map((draft) => (
          <Card key={draft.id} className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                {draft.thumbnailUrl ? (
                  <div className="h-16 w-16 rounded-md overflow-hidden">
                    <img 
                      src={draft.thumbnailUrl} 
                      alt="" 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-md bg-gray-200 flex items-center justify-center">
                    {getTypeIcon(draft.type)}
                  </div>
                )}
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 flex items-center mr-2">
                    {getTypeIcon(draft.type)}
                    <span className="ml-1 capitalize">{draft.type}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    Updated {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
                  </span>
                </div>
                
                <h3 className="font-medium mt-1 truncate">{draft.title}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{draft.preview}</p>
              </div>
              
              <div className="flex-shrink-0 ml-4 flex gap-2">
                <Link href={`/community/create?draft=${draft.id}`}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => deleteDraft(draft.id)}
                  className="text-gray-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
