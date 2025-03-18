/**
 * Thread Reply Component
 * 
 * Allows users to reply to threads
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { 
  Send,
  Image,
  X
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ThreadReplyProps {
  threadId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Thread Reply Component
 */
export const ThreadReply: React.FC<ThreadReplyProps> = ({ 
  threadId, 
  onSuccess, 
  onCancel 
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [replyText, setReplyText] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  
  // Create reply mutation
  const createReply = useMutation({
    mutationFn: async (content: { content_text: string; media_urls?: string[] }) => {
      const response = await fetch(`/api/v1/forum/threads/${threadId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.message || 'Failed to create reply');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setReplyText('');
      setMediaUrls([]);
      queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
      toast({
        title: "Reply Posted",
        description: "Your reply has been added to the thread.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      router.push(`/auth/login?returnUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }
    
    if (!replyText.trim()) {
      toast({
        title: "Error",
        description: "Reply text cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    createReply.mutate({ 
      content_text: replyText,
      media_urls: mediaUrls.length > 0 ? mediaUrls : undefined
    });
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage 
              src={user?.profileImageUrl || ''} 
              alt={user?.username || 'User'} 
            />
            <AvatarFallback>
              {user?.username?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          Post a Reply
        </CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply here..."
            className="min-h-[120px] mb-2"
            disabled={createReply.isPending}
          />
          
          <div className="p-2 border border-dashed rounded-md text-center">
            <Image size={16} className="inline-block mr-1 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Media upload functionality will be implemented in a future update.
            </span>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-2">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={onCancel}
            disabled={createReply.isPending}
          >
            <X size={16} className="mr-1" />
            Cancel
          </Button>
          
          <Button
            type="submit"
            size="sm"
            disabled={createReply.isPending || !replyText.trim()}
          >
            {createReply.isPending ? (
              "Posting..."
            ) : (
              <>
                <Send size={16} className="mr-1" />
                Post Reply
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
