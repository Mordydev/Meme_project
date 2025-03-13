'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ContentForm, ContentTypeSelector, DraftsList } from '@/components/features/content-creation';
import { ContentType } from '@/types/community';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function CreateContentPage() {
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [showDrafts, setShowDrafts] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check for draft parameter
    const draftParam = searchParams.get('draft');
    if (draftParam) {
      setDraftId(draftParam);
      setContentType('text'); // Will be overridden once draft is loaded
    }
    
    // Check for type parameter
    const typeParam = searchParams.get('type') as ContentType | null;
    if (typeParam && ['text', 'image', 'link', 'poll'].includes(typeParam)) {
      setContentType(typeParam);
    }
  }, [searchParams]);
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link href="/community">
            <Button variant="ghost" className="mb-2 pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Community
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Create Content</h1>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setShowDrafts(!showDrafts)}
        >
          {showDrafts ? 'Hide Drafts' : 'View Drafts'}
        </Button>
      </div>
      
      {showDrafts ? (
        <Card className="p-6">
          <DraftsList />
        </Card>
      ) : contentType ? (
        <Card className="p-6">
          <ContentForm contentType={contentType} draftId={draftId || undefined} />
        </Card>
      ) : (
        <Card className="p-6">
          <ContentTypeSelector
            selected={contentType}
            onSelect={setContentType}
          />
        </Card>
      )}
    </div>
  );
}
