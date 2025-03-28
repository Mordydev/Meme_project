'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DraftItem } from '@/types/content-creation';
import { useDrafts } from '@/hooks/useDrafts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlignLeft, 
  Image, 
  Link, 
  BarChart2, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Mock user ID for demo purposes
const MOCK_USER_ID = 'user_123';

export function DraftsList() {
  const router = useRouter();
  const { drafts, deleteDraft, isLoading } = useDrafts(MOCK_USER_ID);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Get the appropriate icon for content type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <AlignLeft className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'link': return <Link className="h-4 w-4" />;
      case 'poll': return <BarChart2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };
  
  // Format date to relative time
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the draft
    
    try {
      setDeleting(id);
      await deleteDraft(id);
    } finally {
      setDeleting(null);
    }
  };
  
  const handleEdit = (id: string) => {
    router.push(`/create?draft=${id}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (drafts.length === 0) {
    return (
      <div className="p-12 border border-dashed rounded-md text-center">
        <FileText className="h-10 w-10 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700">No Drafts Yet</h3>
        <p className="text-sm text-gray-500 mt-2">
          Start creating content and save drafts to see them here
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium flex items-center gap-2">
        <FileText className="h-5 w-5 text-gray-600" />
        Your Drafts ({drafts.length})
      </h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        {drafts.map((draft) => (
          <Card 
            key={draft.id}
            className="overflow-hidden hover:border-primary cursor-pointer transition-colors"
            onClick={() => handleEdit(draft.id)}
          >
            <div className="flex h-full">
              {draft.thumbnailUrl ? (
                <div className="w-1/3 bg-gray-100">
                  <img 
                    src={draft.thumbnailUrl} 
                    alt={draft.title} 
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-1/4 bg-gray-100 flex items-center justify-center">
                  {getTypeIcon(draft.type)}
                </div>
              )}
              
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    {getTypeIcon(draft.type)}
                    <span className="uppercase">{draft.type}</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(draft.id);
                      }}
                      aria-label="Edit draft"
                    >
                      <Edit className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500"
                      onClick={(e) => handleDelete(draft.id, e)}
                      disabled={deleting === draft.id}
                      aria-label="Delete draft"
                    >
                      {deleting === draft.id ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-current"></div>
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <h3 className="font-medium line-clamp-1 mt-1">{draft.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1 flex-grow">{draft.preview}</p>
                
                <div className="flex items-center text-xs text-gray-500 mt-3">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Last edited {formatDate(draft.updatedAt)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
