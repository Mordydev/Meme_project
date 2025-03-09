import { Metadata } from 'next';
import { ContentFeed } from '@/components/features/community';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SearchPageProps {
  searchParams: { 
    q?: string;
    type?: string;
    [key: string]: string | string[] | undefined;
  };
}

export function generateMetadata({ searchParams }: SearchPageProps): Metadata {
  const query = searchParams.q || '';
  
  return {
    title: `Search: ${query} | Community | Wild 'n Out`,
    description: `Search results for "${query}" in the Wild 'n Out community`,
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  const type = typeof searchParams.type === 'string' ? searchParams.type : 'all';
  
  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/community" className="flex items-center text-zinc-400 hover:text-hype-white transition-colors">
          <span className="mr-2">←</span>
          Back to Community
        </Link>
      </div>
      
      <h1 className="text-3xl font-display text-hype-white mb-6">Search Results</h1>
      
      {/* Search form */}
      <form 
        action="/community/search" 
        method="GET"
        className="flex gap-2 mb-8"
      >
        <Input
          type="search"
          name="q"
          placeholder="Search content, battles, or users..."
          defaultValue={query}
          className="flex-1"
        />
        <Button type="submit">
          Search
        </Button>
      </form>
      
      {query ? (
        <>
          <div className="mb-6">
            <p className="text-zinc-300">
              Search results for: <span className="text-hype-white font-medium">"{query}"</span>
            </p>
          </div>
          
          <Tabs defaultValue={type} className="space-y-8">
            <TabsList className="bg-zinc-800/50">
              <TabsTrigger value="all" asChild>
                <Link href={`/community/search?q=${encodeURIComponent(query)}&type=all`}>All</Link>
              </TabsTrigger>
              <TabsTrigger value="content" asChild>
                <Link href={`/community/search?q=${encodeURIComponent(query)}&type=content`}>Content</Link>
              </TabsTrigger>
              <TabsTrigger value="battles" asChild>
                <Link href={`/community/search?q=${encodeURIComponent(query)}&type=battles`}>Battles</Link>
              </TabsTrigger>
              <TabsTrigger value="people" asChild>
                <Link href={`/community/search?q=${encodeURIComponent(query)}&type=people`}>People</Link>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-6">
              <ContentFeed
                initialFilter={type === 'all' ? 'all' : type}
                initialSort="recent"
              />
            </TabsContent>
            
            <TabsContent value="content" className="space-y-6">
              <ContentFeed
                initialFilter="content"
                initialSort="recent"
              />
            </TabsContent>
            
            <TabsContent value="battles" className="space-y-6">
              <ContentFeed
                initialFilter="battles"
                initialSort="recent"
              />
            </TabsContent>
            
            <TabsContent value="people" className="space-y-6">
              {/* People search results would go here */}
              <div className="text-center py-8 bg-zinc-800/30 rounded-lg">
                <p className="text-zinc-400">User search feature coming soon.</p>
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-12 bg-zinc-800/30 rounded-lg">
          <h2 className="text-xl font-display text-hype-white mb-2">Enter a search term</h2>
          <p className="text-zinc-400 mb-6">Search for content, battles, or community members</p>
        </div>
      )}
    </div>
  );
}
