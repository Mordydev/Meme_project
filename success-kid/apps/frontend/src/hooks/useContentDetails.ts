import { useState, useEffect, useCallback } from 'react';
import { Post, Comment } from '@/types/community';
import { useToast } from '@/components/ui/use-toast';

// Mock comments data for development, will be replaced with API call
const generateMockComments = (postId: string, count: number): Comment[] => {
  const authors = [
    { id: 'user1', username: 'crypto_enthusiast', avatarUrl: '/images/avatars/user1.png' },
    { id: 'user2', username: 'success_kid_fan', avatarUrl: '/images/avatars/user2.png' },
    { id: 'user3', username: 'meme_creator', avatarUrl: '/images/avatars/user3.png' },
    { id: 'user4', username: 'token_holder', avatarUrl: '/images/avatars/user4.png' },
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 72));
    const author = authors[Math.floor(Math.random() * authors.length)];
    const hasReplies = Math.random() > 0.7;
    
    return {
      id: `comment_${postId}_${i + 1}`,
      content: `This is a mock comment ${i + 1} on post ${postId}. It contains some sample text to demonstrate the comment component.`,
      author: {
        id: author.id,
        username: author.username,
        avatarUrl: author.avatarUrl,
      },
      createdAt: date.toISOString(),
      voteCount: Math.floor(Math.random() * 50),
      userVote: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : undefined,
      parentId: undefined,
      depth: 0,
      childCount: hasReplies ? Math.floor(Math.random() * 5) + 1 : 0,
    };
  });
};

// Mock post detail data for development, will be replaced with API call
const getMockPostDetail = (postId: string): Post => {
  const types: ('text' | 'image' | 'link' | 'poll')[] = ['text', 'image', 'link', 'poll'];
  const authors = [
    { id: 'user1', username: 'crypto_enthusiast', avatarUrl: '/images/avatars/user1.png' },
    { id: 'user2', username: 'success_kid_fan', avatarUrl: '/images/avatars/user2.png' },
    { id: 'user3', username: 'meme_creator', avatarUrl: '/images/avatars/user3.png' },
    { id: 'user4', username: 'token_holder', avatarUrl: '/images/avatars/user4.png' },
  ];
  
  const categories = [
    'cat_general', 'cat_token', 'cat_memes', 'cat_success', 'cat_strategy', 'cat_help',
    'cat_token_price', 'cat_token_tech'
  ];
  
  const type = types[parseInt(postId.slice(-1)) % types.length];
  const author = authors[parseInt(postId.slice(-1)) % authors.length];
  const categoryId = categories[parseInt(postId.slice(-1)) % categories.length];
  const date = new Date();
  date.setDate(date.getDate() - (parseInt(postId.slice(-1)) % 30));
  const commentCount = 5 + Math.floor(Math.random() * 20);
  
  return {
    id: postId,
    title: `Detailed post ${postId} about Success Kid Community Platform`,
    content: `This is the full content of post ${postId}. It contains more details than the preview shown in the feed. 
    
    The Success Kid Community Platform is a vibrant ecosystem where members can engage, share, and earn rewards for their contributions.
    
    This post is an example of the type of content you might find on the platform. The actual content would be much more substantive and tailored to the specific topic being discussed.`,
    preview: `This is a preview of post ${postId} about Success Kid Community Platform. It would typically be a shortened version of the full content.`,
    type,
    author,
    categoryId,
    createdAt: date.toISOString(),
    commentCount,
    voteCount: Math.floor(Math.random() * 100) + 10,
    userVote: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : undefined,
    mediaUrls: type === 'image' ? ['/images/placeholder.jpg'] : undefined,
  };
};

export function useContentDetails(postId: string) {
  const { toast } = useToast();
  const [content, setContent] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch post details
  useEffect(() => {
    const fetchContentDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // In a real implementation, this would be an API call
        // const response = await fetch(`/api/posts/${postId}`);
        // const data = await response.json();
        
        // Using mock data for now
        setTimeout(() => {
          const mockPost = getMockPostDetail(postId);
          setContent(mockPost);
          
          // Also fetch comments
          const mockComments = generateMockComments(postId, mockPost.commentCount);
          setComments(mockComments);
          
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error fetching post details:', err);
        setError('Failed to load content. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchContentDetails();
  }, [postId]);
  
  // Load comments
  const loadComments = useCallback(async () => {
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/posts/${postId}/comments`);
      // const data = await response.json();
      
      // Using mock data for now
      setTimeout(() => {
        const mockComments = generateMockComments(postId, Math.floor(Math.random() * 10) + 5);
        setComments(prevComments => [...prevComments, ...mockComments]);
      }, 500);
    } catch (err) {
      console.error('Error loading comments:', err);
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive",
      });
    }
  }, [postId, toast]);
  
  // Add a comment
  const addComment = useCallback(async (commentContent: string) => {
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/posts/${postId}/comments`, {
      //   method: 'POST',
      //   body: JSON.stringify({ content: commentContent }),
      // });
      // const data = await response.json();
      
      // Using mock data for now
      const newComment: Comment = {
        id: `comment_${postId}_${Date.now()}`,
        content: commentContent,
        author: {
          id: 'current_user',
          username: 'current_user',
          avatarUrl: undefined,
        },
        createdAt: new Date().toISOString(),
        voteCount: 0,
        userVote: 'up', // User's own comment automatically upvoted
        parentId: undefined,
        depth: 0,
        childCount: 0,
      };
      
      setComments(prevComments => [newComment, ...prevComments]);
      
      // Update comment count in post
      setContent(prevContent => {
        if (!prevContent) return null;
        return {
          ...prevContent,
          commentCount: prevContent.commentCount + 1,
        };
      });
      
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully",
      });
      
      // Also show points earned
      toast({
        title: "Points earned!",
        description: "You earned 10 Success Points for posting a comment",
      });
      
      return newComment;
    } catch (err) {
      console.error('Error adding comment:', err);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  }, [postId, toast]);
  
  // Handle voting on post
  const handleVote = useCallback((contentId: string, direction: 'up' | 'down') => {
    setContent(prevContent => {
      if (!prevContent) return null;
      
      // If user already voted in this direction, remove the vote
      if (prevContent.userVote === direction) {
        return {
          ...prevContent,
          userVote: undefined,
          voteCount: direction === 'up' ? prevContent.voteCount - 1 : prevContent.voteCount + 1
        };
      }
      
      // If user already voted in opposite direction, switch the vote
      if (prevContent.userVote) {
        return {
          ...prevContent,
          userVote: direction,
          voteCount: direction === 'up' ? prevContent.voteCount + 2 : prevContent.voteCount - 2
        };
      }
      
      // New vote
      return {
        ...prevContent,
        userVote: direction,
        voteCount: direction === 'up' ? prevContent.voteCount + 1 : prevContent.voteCount - 1
      };
    });
    
    // In a real implementation, this would make an API call to record the vote
  }, []);
  
  return {
    content,
    comments,
    isLoading,
    error,
    loadComments,
    addComment,
    handleVote
  };
}
