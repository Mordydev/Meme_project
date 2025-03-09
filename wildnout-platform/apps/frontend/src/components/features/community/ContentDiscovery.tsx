'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { ContentItem } from './ContentFeed';
import { Input } from '@/components/ui/input';

interface Collection {
  id: string;
  title: string;
  items: ContentItem[];
}

interface ContentDiscoveryProps {
  initialTrendingTopics?: string[];
  initialCreators?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
    followerCount: number;
  }[];
  initialCollections?: Collection[];
}

export function ContentDiscovery({
  initialTrendingTopics = [],
  initialCreators = [],
  initialCollections = [],
}: ContentDiscoveryProps) {
  const [trendingTopics, setTrendingTopics] = useState<string[]>(initialTrendingTopics);
  const [creators, setCreators] = useState(initialCreators);
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState({
    topics: initialTrendingTopics.length === 0,
    creators: initialCreators.length === 0,
    collections: initialCollections.length === 0,
  });
  
  // Fetch trending topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(prev => ({ ...prev, topics: true }));
        
        // Mock data - replace with actual API call
        const mockTopics = [
          'freestyle', 'rhymes', 'wildstyle', 'rap', 'comedy',
          'battle', 'roast', 'hiphop', 'funny', 'bars'
        ];
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setTrendingTopics(mockTopics);
      } catch (error) {
        console.error('Error fetching trending topics:', error);
      } finally {
        setLoading(prev => ({ ...prev, topics: false }));
      }
    };
    
    if (initialTrendingTopics.length === 0) {
      fetchTopics();
    }
  }, [initialTrendingTopics]);
  
  // Fetch recommended creators
  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(prev => ({ ...prev, creators: true }));
        
        // Mock data - replace with actual API call
        const mockCreators = [
          {
            id: 'user-1',
            username: 'BattleKing',
            avatarUrl: '/avatars/user-1.jpg',
            followerCount: 9543,
          },
          {
            id: 'user-2',
            username: 'RhymeQueen',
            avatarUrl: '/avatars/user-2.jpg',
            followerCount: 7652,
          },
          {
            id: 'user-3',
            username: 'FunnyGuy',
            avatarUrl: '/avatars/user-3.jpg',
            followerCount: 5941,
          },
          {
            id: 'user-4',
            username: 'CreativeMC',
            avatarUrl: '/avatars/user-4.jpg',
            followerCount: 3872,
          },
          {
            id: 'user-5',
            username: 'FlowMaster',
            avatarUrl: '/avatars/user-5.jpg',
            followerCount: 2463,
          },
        ];
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 700));
        
        setCreators(mockCreators);
      } catch (error) {
        console.error('Error fetching creators:', error);
      } finally {
        setLoading(prev => ({ ...prev, creators: false }));
      }
    };
    
    if (initialCreators.length === 0) {
      fetchCreators();
    }
  }, [initialCreators]);
  
  // Fetch content collections
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(prev => ({ ...prev, collections: true }));
        
        // Mock data - replace with actual API call
        const mockCollections = [
          {
            id: 'collection-1',
            title: 'Top Battles This Week',
            items: Array.from({ length: 3 }).map((_, i) => ({
              id: `content-${i + 1}`,
              type: 'battle',
              title: `Epic Battle ${i + 1}`,
              body: 'Check out this amazing battle!',
              authorId: `user-${i + 1}`,
              author: {
                id: `user-${i + 1}`,
                username: ['BattleKing', 'RhymeQueen', 'FunnyGuy'][i],
                avatarUrl: `/avatars/user-${i + 1}.jpg`,
              },
              createdAt: new Date(Date.now() - Math.random() * 604800000).toISOString(),
              metrics: {
                likes: Math.floor(Math.random() * 100) + 50,
                comments: Math.floor(Math.random() * 30) + 10,
                shares: Math.floor(Math.random() * 15) + 5,
              },
              tags: ['battle', 'rhyme', 'bars'],
              mediaUrl: `/sample-media/battle-${i + 1}.jpg`,
            })),
          },
          {
            id: 'collection-2',
            title: 'Hilarious Comedy Content',
            items: Array.from({ length: 3 }).map((_, i) => ({
              id: `content-${i + 4}`,
              type: 'post',
              body: 'Some of the funniest content on the platform!',
              authorId: `user-${i + 3}`,
              author: {
                id: `user-${i + 3}`,
                username: ['FunnyGuy', 'ComedyKing', 'LaughMaster'][i],
                avatarUrl: `/avatars/user-${i + 3}.jpg`,
              },
              createdAt: new Date(Date.now() - Math.random() * 604800000).toISOString(),
              metrics: {
                likes: Math.floor(Math.random() * 100) + 30,
                comments: Math.floor(Math.random() * 30) + 5,
                shares: Math.floor(Math.random() * 15) + 3,
              },
              tags: ['funny', 'comedy', 'lol'],
              mediaUrl: i % 2 === 0 ? `/sample-media/comedy-${i + 1}.jpg` : null,
            })),
          },
        ];
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 900));
        
        setCollections(mockCollections);
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(prev => ({ ...prev, collections: false }));
      }
    };
    
    if (initialCollections.length === 0) {
      fetchCollections();
    }
  }, [initialCollections]);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Navigate to search results
    window.location.href = `/community/search?q=${encodeURIComponent(searchQuery)}`;
  };
  
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="search"
            placeholder="Search content, battles, or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!searchQuery.trim()}>
            Search
          </Button>
        </form>
      </div>
      
      {/* Trending Topics */}
      <section className="space-y-3">
        <h2 className="text-xl font-display text-hype-white">Trending Topics</h2>
        
        {loading.topics ? (
          <div className="flex flex-wrap gap-2 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 bg-zinc-800 rounded-full px-4" style={{ width: `${40 + Math.random() * 60}px` }}></div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {trendingTopics.map((topic) => (
              <Link
                key={topic}
                href={`/community?filter=tag&tag=${topic}`}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-hype-white transition-colors"
              >
                #{topic}
              </Link>
            ))}
          </div>
        )}
      </section>
      
      {/* Creator Recommendations */}
      <section className="space-y-3">
        <h2 className="text-xl font-display text-hype-white">Creators to Follow</h2>
        
        {loading.creators ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 bg-zinc-800 rounded-lg flex flex-col items-center space-y-3">
                <div className="w-16 h-16 bg-zinc-700 rounded-full"></div>
                <div className="h-4 bg-zinc-700 rounded w-20"></div>
                <div className="h-3 bg-zinc-700 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {creators.map((creator) => (
              <Link
                key={creator.id}
                href={`/profile/${creator.id}`}
                className="p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg flex flex-col items-center space-y-2 transition-colors"
              >
                <Avatar
                  src={creator.avatarUrl || undefined}
                  alt={creator.username}
                  fallback={creator.username.charAt(0).toUpperCase()}
                  className="w-16 h-16"
                />
                <h3 className="font-medium text-hype-white text-center">{creator.username}</h3>
                <p className="text-xs text-zinc-400">{creator.followerCount.toLocaleString()} followers</p>
              </Link>
            ))}
          </div>
        )}
      </section>
      
      {/* Content Collections */}
      <section className="space-y-3">
        <h2 className="text-xl font-display text-hype-white">Featured Collections</h2>
        
        {loading.collections ? (
          <div className="space-y-6 animate-pulse">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-6 bg-zinc-800 rounded w-48"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="bg-zinc-800 rounded-lg p-4 h-40"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {collections.map((collection) => (
              <div key={collection.id} className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-lg text-hype-white">{collection.title}</h3>
                  <Link href={`/community?collection=${collection.id}`}>
                    <Button variant="ghost" size="sm" className="text-battle-yellow hover:text-battle-yellow/80">
                      View All
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {collection.items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/community/content/${item.id}`}
                      className="block"
                    >
                      <Card className="h-full overflow-hidden hover:bg-zinc-800/70 transition-colors">
                        <div className="p-4">
                          <div className="flex items-center mb-3">
                            <Avatar
                              src={item.author.avatarUrl || undefined}
                              alt={item.author.username}
                              fallback={item.author.username.charAt(0).toUpperCase()}
                              className="h-6 w-6 mr-2"
                            />
                            <span className="text-sm text-zinc-300">{item.author.username}</span>
                          </div>
                          
                          {item.title && (
                            <h4 className="font-medium text-hype-white mb-2">{item.title}</h4>
                          )}
                          
                          <p className="text-zinc-400 text-sm line-clamp-2">{item.body}</p>
                          
                          <div className="flex gap-3 mt-3 text-xs text-zinc-500">
                            <span>❤️ {item.metrics.likes}</span>
                            <span>💬 {item.metrics.comments}</span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
