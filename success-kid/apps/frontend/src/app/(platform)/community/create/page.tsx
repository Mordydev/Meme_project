import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent } from '@/components/ui/card';
import { ContentTypeSelector, ContentForm } from '@/components/features/content-creation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { ContentType } from '@/types/community';

'use client';

export default function CreatePostPage() {
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('text');
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Create Post"
        description="Share with the Success Kid community"
      />
      
      <Card>
        <CardContent className="p-6">
          <div className="max-w-3xl mx-auto">
            <Tabs value="post" className="mb-8">
              <TabsList className="mb-6">
                <TabsTrigger value="post" className="flex-1">Create Post</TabsTrigger>
                <TabsTrigger value="draft" className="flex-1">My Drafts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="post" className="space-y-6">
                <ContentTypeSelector 
                  selected={selectedContentType}
                  onSelect={setSelectedContentType}
                />
                
                <div className="mt-8">
                  <ContentForm contentType={selectedContentType} />
                </div>
              </TabsContent>
              
              <TabsContent value="draft">
                <div className="p-8 border border-dashed rounded-md text-center">
                  <h3 className="text-lg font-medium text-muted-foreground">
                    Your draft posts will appear here
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start creating content and save drafts to see them here
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
