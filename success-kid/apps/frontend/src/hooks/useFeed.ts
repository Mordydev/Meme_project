import { useState, useEffect, useCallback } from 'react';
import { Post, FeedFilters, FeedType } from '@/types/community';

// Mock data for development, will be replaced with API call
const generateMockPosts = (count: number, categoryId?: string): Post[] => {
  const types: ('text' | 'image' | 'link' | 'poll')[] = ['text', 'image', 'link', 'poll'];
  const mockUsers = [
    { id: 'user1', username: 'crypto_enthusiast', avatarUrl: '/images/avatars/user1.png' },
    { id: 'user2', username: 'success_kid_fan', avatarUrl: '/images/avatars/user2.png' },
    { id: 'user3', username: 'meme_creator', avatarUrl: '/images/avatars/user3.png' },
    { id: 'user4', username: 'token_holder', avatarUrl: '/images/avatars/user4.png' },
  ];
  
  const mockCategories = [
    'cat_general', 'cat_token', 'cat_memes', 'cat_success', 'cat_strategy', 'cat_help',
    'cat_token_price', 'cat_token_tech'
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const author = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    const randomCategoryId = categoryId || mockCategories[Math.floor(Math.random() * mockCategories.length)];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    return {
      id: `post_${i + 1}`,
      title: `Sample Post ${i + 1} about Success Kid Community`,
      preview: 'This is a preview of the post content. It can be text, an image, a link, or a poll depending on the type of post.',
      type,
      author,
      categoryId: randomCategoryId,
      createdAt: date.toISOString(),
      commentCount: Math.floor(Math.random() * 50),
      voteCount: Math.floor(Math.random() * 100),
      userVote: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : undefined,
      mediaUrls: type === 'image' ? ['/images/placeholder.jpg'] : undefined
    };
  });
};

export function useFeed(initialFilters: FeedFilters) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<FeedFilters>(initialFilters);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  // Function to fetch posts based on filters
  const fetchPosts = useCallback(async (pageNumber: number, newFilters?: FeedFilters) => {
    try {
      setIsLoading(true);
      
      // In the future, this will be replaced with an actual API call
      // const response = await fetch('/api/posts?category=${filters.categoryId}&feedType=${filters.feedType}&page=${page}');
      // const data = await response.json();
      
      // Using mock data for now
      setTimeout(() => {
        const currentFilters = newFilters || filters;
        const mockPosts = generateMockPosts(10, currentFilters.categoryId);
        
        // Sort based on feed type
        const sortedPosts = [...mockPosts].sort((a, b) => {
          if (currentFilters.feedType === 'latest') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          } else if (currentFilters.feedType === 'trending') {
            return b.voteCount - a.voteCount;
          }
          return 0;
        });
        
        if (pageNumber === 1) {
          setPosts(sortedPosts);
        } else {
          setPosts(prev => [...prev, ...sortedPosts]);
        }
        
        setHasMore(pageNumber < 5); // Simulate pagination (5 pages total)
        setIsLoading(false);
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch posts'));
      setIsLoading(false);
    }
  }, [filters]);
  
  // Initial fetch
  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);
  
  // Function to update filters and reset pagination
  const updateFilters = useCallback((newFilters: Partial<FeedFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setPage(1);
    fetchPosts(1, updatedFilters);
  }, [filters, fetchPosts]);
  
  // Function to load more posts
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  }, [isLoading, hasMore, page, fetchPosts]);
  
  // Function to handle voting
  const handleVote = useCallback((postId: string, direction: 'up' | 'down') => {
    setPosts(currentPosts =>
      currentPosts.map(post => {
        if (post.id === postId) {
          // If user already voted in this direction, remove the vote
          if (post.userVote === direction) {
            return {
              ...post,
              userVote: undefined,
              voteCount: direction === 'up' ? post.voteCount - 1 : post.voteCount + 1
            };
          }
          
          // If user already voted in opposite direction, switch the vote
          if (post.userVote) {
            return {
              ...post,
              userVote: direction,
              voteCount: direction === 'up' ? post.voteCount + 2 : post.voteCount - 2
            };
          }
          
          // New vote
          return {
            ...post,
            userVote: direction,
            voteCount: direction === 'up' ? post.voteCount + 1 : post.voteCount - 1
          };
        }
        return post;
      })
    );
    
    // In a real implementation, this would make an API call to record the vote
  }, []);
  
  // Function to change the feed type
  const changeFeedType = useCallback((feedType: FeedType) => {
    updateFilters({ feedType });
  }, [updateFilters]);
  
  // Function to change the category
  const changeCategory = useCallback((categoryId?: string) => {
    updateFilters({ categoryId });
  }, [updateFilters]);
  
  return {
    posts,
    isLoading,
    error,
    hasMore,
    filters,
    loadMore,
    handleVote,
    changeFeedType,
    changeCategory
  };
}
