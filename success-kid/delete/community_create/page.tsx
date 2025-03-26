'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ContentTypeSelector, 
  ContentForm, 
  DraftsList 
} from '@/components/features/content-creation';
import { ContentType } from '@/types/community';
import { Edit, FileText, Sparkles } from 'lucide-react';

export default function CreatePostPage() {
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('text');
  const [activeTab, setActiveTab] = useState('post');
  const [draftId, setDraftId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  
  // Check for draft parameter in URL
  useEffect(() => {
    const draft = searchParams.get('draft');
    if (draft) {
      setDraftId(draft);
      setActiveTab('post');
    }
  }, [searchParams]);
  
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Create Content"
        description="Share with the Success Kid community and earn rewards"
        icon={<Sparkles className="h-5 w-5 text-primary" />}
      />
      
      <Card>
        <CardContent className="p-6">
          <div className="max-w-5xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="mb-6">
                <TabsTrigger value="post" className="flex-1">
                  <span className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Create Content
                  </span>
                </TabsTrigger>
                <TabsTrigger value="drafts" className="flex-1">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    My Drafts
                  </span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="post" className="space-y-6">
                <ContentTypeSelector 
                  selected={selectedContentType}
                  onSelect={setSelectedContentType}
                />
                
                <div className="mt-8">
                  <ContentForm 
                    contentType={selectedContentType} 
                    draftId={draftId || undefined} 
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="drafts">
                <DraftsList />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
