/**
 * Forum View Component
 * 
 * Displays a single forum with its categories and stats
 */
'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers, MessageSquare, ChevronRight, BarChart3, Users } from 'lucide-react';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

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
  content_count?: number;
}

interface Forum {
  id: string;
  name: string;
  description: string;
  slug: string;
  type: string;
  status: string;
  order: number;
  icon: string;
  theme_color: string;
  categories: Category[];
  stats: {
    threads: number;
    posts: number;
    activity: number;
  };
}

interface ForumViewProps {
  slug: string;
}

/**
 * Forum View Component
 */
export const ForumView: React.FC<ForumViewProps> = ({ slug }) => {
  const router = useRouter();
  
  // Fetch forum data
  const { data: forumData, isLoading, error } = useQuery<{ data: Forum }>({
    queryKey: ['forum', slug],
    queryFn: async () => {
      const response = await fetch(`/api/v1/forum/forums/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch forum');
      }
      return response.json();
    },
    enabled: !!slug,
  });

  const forum = forumData?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2 mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-2/3" />
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

  if (error || !forum) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500">
        <h3 className="font-bold">Error loading forum</h3>
        <p>The requested forum could not be found or there was an error loading it.</p>
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
            <BreadcrumbLink>{forum.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{forum.name}</h1>
          <p className="text-muted-foreground">{forum.description}</p>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <MessageSquare size={16} className="mr-1" />
            <span>{forum.stats.threads} threads</span>
          </div>
          <div className="flex items-center">
            <Users size={16} className="mr-1" />
            <span>{forum.stats.posts} posts</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {forum.categories.map((category) => (
          <Link href={`/forum/category/${category.id}`} key={category.id} passHref>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-1 h-6 rounded-full" 
                    style={{ backgroundColor: category.color || '#1E88E5' }}
                  ></div>
                  <CardTitle>{category.name}</CardTitle>
                </div>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                {category.subcategories && category.subcategories.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    {category.subcategories.map((subcat) => (
                      <Link 
                        href={`/forum/category/${subcat.id}`} 
                        key={subcat.id}
                        className="flex items-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        <ChevronRight size={16} className="mr-1 text-muted-foreground" />
                        <span>{subcat.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div>
                      <Layers size={16} className="inline mr-1" />
                      <span>{category.content_count || 0} threads</span>
                    </div>
                  </div>
                  <ChevronRight size={18} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
