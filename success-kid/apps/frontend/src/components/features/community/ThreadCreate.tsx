/**
 * Thread Create Component
 * 
 * Allows users to create new discussion threads
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft,
  Trash,
  Plus,
  Image
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Types
interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  parent_id: string | null;
  order: number;
  icon: string;
  color: string;
  is_active: boolean;
}

interface Forum {
  id: string;
  name: string;
  slug: string;
  categories: Category[];
}

interface PollOption {
  id: string;
  text: string;
}

interface ThreadCreateProps {
  preselectedCategoryId?: string;
}

/**
 * Thread Create Component
 */
export const ThreadCreate: React.FC<ThreadCreateProps> = ({ preselectedCategoryId }) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  
  // State for form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [forumId, setForumId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>(preselectedCategoryId || '');
  const [threadType, setThreadType] = useState<'discussion' | 'question' | 'poll'>('discussion');
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: crypto.randomUUID(), text: '' },
    { id: crypto.randomUUID(), text: '' }
  ]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  
  // Fetch forums data
  const { data: forumsData, isLoading: isLoadingForums } = useQuery<{ data: Forum[] }>({
    queryKey: ['forums'],
    queryFn: async () => {
      const response = await fetch('/api/v1/forum/forums');
      if (!response.ok) {
        throw new Error('Failed to fetch forums');
      }
      return response.json();
    }
  });

  const forums = forumsData?.data || [];
  
  // Get categories for selected forum
  const categories = forums.find(f => f.id === forumId)?.categories || [];
  
  // Set forum if only one is available
  useEffect(() => {
    if (forums.length === 1 && !forumId) {
      setForumId(forums[0].id);
    }
  }, [forums, forumId]);
  
  // Set forum ID if category is preselected
  useEffect(() => {
    if (preselectedCategoryId && forums.length > 0 && !forumId) {
      for (const forum of forums) {
        const category = forum.categories.find(c => c.id === preselectedCategoryId);
        if (category) {
          setForumId(forum.id);
          break;
        }
      }
    }
  }, [preselectedCategoryId, forums, forumId]);
  
  // Mutation for creating thread
  const createThread = useMutation({
    mutationFn: async (threadData: any) => {
      const response = await fetch('/api/v1/forum/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(threadData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.message || 'Failed to create thread');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Thread Created",
        description: "Your thread has been created successfully",
      });
      
      // Redirect to thread
      router.push(`/forum/thread/${data.data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/auth/login?returnUrl=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, router]);
  
  // Handler for poll options
  const addPollOption = () => {
    setPollOptions([...pollOptions, { id: crypto.randomUUID(), text: '' }]);
  };
  
  const removePollOption = (id: string) => {
    if (pollOptions.length <= 2) {
      toast({
        title: "Cannot Remove",
        description: "Polls must have at least 2 options",
        variant: "destructive",
      });
      return;
    }
    
    setPollOptions(pollOptions.filter(option => option.id !== id));
  };
  
  const updatePollOption = (id: string, text: string) => {
    setPollOptions(
      pollOptions.map(option => 
        option.id === id ? { ...option, text } : option
      )
    );
  };
  
  // Handler for form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Thread title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Thread content is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!forumId) {
      toast({
        title: "Error",
        description: "Please select a forum",
        variant: "destructive",
      });
      return;
    }
    
    if (!categoryId) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }
    
    if (threadType === 'poll') {
      const emptyOptions = pollOptions.filter(option => !option.text.trim());
      if (emptyOptions.length > 0) {
        toast({
          title: "Error",
          description: "All poll options must have text",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Prepare thread data
    const threadData = {
      title,
      forum_id: forumId,
      category_id: categoryId,
      type: threadType,
      content: {
        content_text: content,
        media_urls: mediaUrls,
        poll_options: threadType === 'poll' ? pollOptions : undefined
      }
    };
    
    createThread.mutate(threadData);
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/forum">Forums</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Create Thread</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Thread</h1>
        
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="gap-1"
        >
          <ChevronLeft size={16} />
          Back
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thread Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="forum">Forum</Label>
                <Select 
                  value={forumId} 
                  onValueChange={setForumId}
                  disabled={isLoadingForums || createThread.isPending}
                >
                  <SelectTrigger id="forum">
                    <SelectValue placeholder="Select a forum" />
                  </SelectTrigger>
                  <SelectContent>
                    {forums.map(forum => (
                      <SelectItem key={forum.id} value={forum.id}>
                        {forum.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={categoryId} 
                  onValueChange={setCategoryId}
                  disabled={!forumId || createThread.isPending}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Thread Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title"
                maxLength={200}
                disabled={createThread.isPending}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Thread Type</Label>
              <RadioGroup
                value={threadType}
                onValueChange={(value) => setThreadType(value as 'discussion' | 'question' | 'poll')}
                className="flex flex-col space-y-1"
                disabled={createThread.isPending}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="discussion" id="type-discussion" />
                  <Label htmlFor="type-discussion">Discussion</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="question" id="type-question" />
                  <Label htmlFor="type-question">Question</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="poll" id="type-poll" />
                  <Label htmlFor="type-poll">Poll</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Thread Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter the content of your thread"
                className="min-h-[200px]"
                disabled={createThread.isPending}
              />
            </div>
            
            {threadType === 'poll' && (
              <div className="space-y-2">
                <Label>Poll Options</Label>
                <div className="space-y-2">
                  {pollOptions.map((option, index) => (
                    <div key={option.id} className="flex gap-2">
                      <Input 
                        value={option.text}
                        onChange={(e) => updatePollOption(option.id, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        disabled={createThread.isPending}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removePollOption(option.id)}
                        disabled={createThread.isPending}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPollOption}
                    className="mt-2"
                    disabled={createThread.isPending}
                  >
                    <Plus size={16} className="mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Media (Optional)</Label>
              <div className="p-4 border border-dashed rounded-md text-center">
                <Image size={24} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Media upload functionality will be implemented in a future update.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={createThread.isPending}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={createThread.isPending}
          >
            {createThread.isPending ? "Creating..." : "Create Thread"}
          </Button>
        </div>
      </form>
    </div>
  );
};
