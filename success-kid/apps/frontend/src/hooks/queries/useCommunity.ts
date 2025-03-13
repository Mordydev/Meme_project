import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { 
  Category, 
  Post, 
  Comment, 
  CommentSort, 
  ContentType, 
  ContentFeedType,
  ReportResponse
} from '@/types';

/**
 * Fetch all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ categories: Category[] }>('/api/v1/categories');
      return data.categories;
    },
  });
}

/**
 * Fetch posts feed
 */
export function usePostsFeed(options: {
  categoryId?: string;
  feed: ContentFeedType;
  limit?: number;
  offset?: number;
}) {
  const { categoryId, feed, limit = 20, offset = 0 } = options;
  
  return useQuery({
    queryKey: ['posts', { categoryId, feed, limit, offset }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      params.append('feed', feed);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      
      const { data } = await apiClient.get<{ posts: Post[], pagination: any }>(
        `/api/v1/posts?${params.toString()}`
      );
      return data;
    },
  });
}

/**
 * Fetch a single post
 */
export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ post: Post }>(`/api/v1/posts/${postId}`);
      return data.post;
    },
    enabled: !!postId,
  });
}

/**
 * Fetch comments for a post
 */
export function useComments(options: {
  postId: string;
  sort?: CommentSort;
  limit?: number;
  offset?: number;
}) {
  const { postId, sort = 'top', limit = 50, offset = 0 } = options;
  
  return useQuery({
    queryKey: ['comments', { postId, sort, limit, offset }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('sort', sort);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      
      const { data } = await apiClient.get<{ comments: Comment[], pagination: any }>(
        `/api/v1/posts/${postId}/comments?${params.toString()}`
      );
      return data;
    },
    enabled: !!postId,
  });
}

/**
 * Create a new post
 */
export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newPost: { 
      title: string; 
      content: string; 
      type: ContentType; 
      categoryId: string;
      mediaUrls?: string[];
      tags?: string[];
    }) => {
      const { data } = await apiClient.post<{ post: Post, pointsAwarded: number }>(
        '/api/v1/posts',
        { data: newPost }
      );
      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

/**
 * Create a comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newComment: { 
      postId: string; 
      content: string; 
      parentId?: string; 
    }) => {
      const { postId, ...commentData } = newComment;
      const { data } = await apiClient.post<{ comment: Comment, pointsAwarded: number }>(
        `/api/v1/posts/${postId}/comments`,
        { data: commentData }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate comments for this post
      queryClient.invalidateQueries({ queryKey: ['comments', { postId: variables.postId }] });
      
      // Also update post to reflect new comment count
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
}

/**
 * Vote on post
 */
export function useVotePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, direction }: { postId: string; direction: 'up' | 'down' | null }) => {
      const { data } = await apiClient.post<{ voteCount: number; userVote: 'up' | 'down' | null; pointsAwarded?: number }>(
        `/api/v1/posts/${postId}/vote`,
        { data: { direction } }
      );
      return { ...data, postId };
    },
    // Optimistic update
    onMutate: async ({ postId, direction }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      
      // Get current post state
      const previousPost = queryClient.getQueryData<Post>(['post', postId]);
      
      if (previousPost) {
        // Calculate the vote delta
        let voteDelta = 0;
        if (direction === 'up' && previousPost.userVote !== 'up') voteDelta = previousPost.userVote === 'down' ? 2 : 1;
        else if (direction === 'down' && previousPost.userVote !== 'down') voteDelta = previousPost.userVote === 'up' ? -2 : -1;
        else if (direction === null && previousPost.userVote === 'up') voteDelta = -1;
        else if (direction === null && previousPost.userVote === 'down') voteDelta = 1;
        
        // Update the post with optimistic data
        queryClient.setQueryData<Post>(['post', postId], {
          ...previousPost,
          voteCount: previousPost.voteCount + voteDelta,
          userVote: direction,
        });
        
        // Update in posts feed lists
        queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
          if (!old?.posts) return old;
          
          return {
            ...old,
            posts: old.posts.map((post: Post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  voteCount: post.voteCount + voteDelta,
                  userVote: direction,
                };
              }
              return post;
            }),
          };
        });
      }
      
      return { previousPost };
    },
    onError: (err, { postId }, context) => {
      // Revert to previous state if error occurs
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
    },
    onSettled: (data) => {
      // Invalidate post to fetch fresh data
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['post', data.postId] });
      }
    },
  });
}

/**
 * Vote on comment
 */
export function useVoteComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      postId, 
      commentId, 
      direction 
    }: { 
      postId: string; 
      commentId: string; 
      direction: 'up' | 'down' | null 
    }) => {
      const { data } = await apiClient.post<{ voteCount: number; userVote: 'up' | 'down' | null; pointsAwarded?: number }>(
        `/api/v1/comments/${commentId}/vote`,
        { data: { direction } }
      );
      return { ...data, commentId, postId };
    },
    // Implement optimistic updates similar to post voting
    onSuccess: (_, variables) => {
      // Invalidate comments for this post
      queryClient.invalidateQueries({ queryKey: ['comments', { postId: variables.postId }] });
    },
  });
}

/**
 * Report content (post or comment)
 */
export function useReportContent() {
  return useMutation({
    mutationFn: async ({ 
      contentId, 
      contentType, 
      reason, 
      details 
    }: { 
      contentId: string; 
      contentType: 'post' | 'comment'; 
      reason: string; 
      details?: string 
    }) => {
      const { data } = await apiClient.post<ReportResponse>(
        '/api/v1/moderation/report',
        { data: { contentId, contentType, reason, details } }
      );
      return data;
    },
  });
}

/**
 * Block user
 */
export function useBlockUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await apiClient.post<{ success: boolean; blockedAt: string }>(
        `/api/v1/users/${userId}/block`
      );
      return data;
    },
  });
}
