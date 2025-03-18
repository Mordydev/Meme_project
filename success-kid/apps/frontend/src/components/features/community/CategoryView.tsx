/**
 * Category View Component
 * 
 * Displays a category with its threads and subcategories
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  MessageSquare, 
  Eye, 
  Clock, 
  ChevronRight, 
  Layers, 
  Plus, 
  Filter,
  ArrowUpDown 
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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
  subcategories?: Category[];
}

interface Thread {
  id: string;
  title: string;
  user_id: string;
  category_id: string;
  forum_id: string;
  type: string;
  status: string;
  is_pinned: boolean;
  is_locked: boolean;
  views: number;
  created_at: string;
  last_activity_at: string;
  preview: string;
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  stats: {
    replies: number;
    participants: number;
    likes: number;
  };
  last_activity: {
    user_id: string | null;
    user_name: string | null;
    timestamp: string;
  };
}

interface CategoryData {
  id: string;
  name: string;
  description: string;
  slug: string;
  parent_id: string | null;
  order: number;
  icon: string;
  color: string;
  is_active: boolean;
  subcategories: Category[];
  threads: Thread[];
}

interface CategoryViewProps {
  categoryId: string;
}

/**
 * Format date to relative time
 */
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);
  
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
};

/**
 * Category View Component
 */
export const CategoryView: React.FC<CategoryViewProps> = ({ categoryId }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [sortOption, setSortOption] = useState<'recent' | 'newest' | 'views'>('recent');
  
  // Fetch category data
  const { data: categoryData, isLoading, error, refetch } = useQuery<{ data: CategoryData }>({
    queryKey: ['category', categoryId, sortOption],
    queryFn: async () => {
      const response = await fetch(`/api/v1/forum/categories/${categoryId}/threads?sort=${sortOption}`);
      if (!response.ok) {
        throw new Error('Failed to fetch category');
      }
      return response.json();
    },
    enabled: !!categoryId,
  });

  const category = categoryData?.data;

  const handleCreateThread = () => {
    if (isAuthenticated) {
      router.push(`/forum/create?category=${categoryId}`);
    } else {
      // Redirect to login
      router.push(`/auth/login?returnUrl=${encodeURIComponent(router.asPath)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2 mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500">
        <h3 className="font-bold">Error loading category</h3>
        <p>The requested category could not be found or there was an error loading it.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push('/forum')}
        >
          Back to Forums
        </Button>
      </div>
    );
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
            <BreadcrumbLink>{category.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div 
              className="w-2 h-6 rounded-full hidden md:block" 
              style={{ backgroundColor: category.color || '#1E88E5' }}
            ></div>
            {category.name}
          </h1>
          <p className="text-muted-foreground">{category.description}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ArrowUpDown size={16} />
                <span className="hidden md:inline">Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortOption('recent')}>
                Recent Activity
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption('newest')}>
                Newest
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption('views')}>
                Most Viewed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={handleCreateThread} size="sm" className="h-8 gap-1">
            <Plus size={16} />
            <span className="hidden md:inline">New Thread</span>
          </Button>
        </div>
      </div>
      
      {/* Subcategories */}
      {category.subcategories && category.subcategories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {category.subcategories.map((subcat) => (
            <Link href={`/forum/category/${subcat.id}`} key={subcat.id} passHref>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-1 h-6 rounded-full" 
                      style={{ backgroundColor: subcat.color || '#1E88E5' }}
                    ></div>
                    <CardTitle className="text-base">{subcat.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{subcat.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      
      {/* Threads */}
      <div className="space-y-4">
        {category.threads.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium">No threads yet</h3>
            <p className="text-muted-foreground mb-4">Be the first to start a discussion in this category</p>
            <Button onClick={handleCreateThread}>
              <Plus size={16} className="mr-2" />
              Create Thread
            </Button>
          </div>
        ) : (
          category.threads.map((thread) => (
            <Link href={`/forum/thread/${thread.id}`} key={thread.id} passHref>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {thread.is_pinned && (
                          <Badge variant="outline" className="mr-2 align-middle">Pinned</Badge>
                        )}
                        {thread.is_locked && (
                          <Badge variant="outline" className="mr-2 align-middle">Locked</Badge>
                        )}
                        {thread.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={thread.author.avatar_url || ''} alt={thread.author.display_name} />
                          <AvatarFallback>{thread.author.display_name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span>{thread.author.display_name}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(thread.created_at)}</span>
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center" title="Replies">
                        <MessageSquare size={16} className="mr-1" />
                        <span>{thread.stats.replies}</span>
                      </div>
                      <div className="flex items-center" title="Views">
                        <Eye size={16} className="mr-1" />
                        <span>{thread.views}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{thread.preview}</p>
                </CardContent>
                
                <CardFooter className="pt-2 text-xs text-muted-foreground border-t">
                  <div className="w-full flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="mr-1" />
                      <span>
                        Last reply {thread.last_activity.user_name ? `by ${thread.last_activity.user_name}` : ''} {formatRelativeTime(thread.last_activity.timestamp)}
                      </span>
                    </div>
                    <ChevronRight size={16} />
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};
