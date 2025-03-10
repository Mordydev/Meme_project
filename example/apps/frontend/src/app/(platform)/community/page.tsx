import { Metadata } from 'next';
import { ContentFeed, ContentDiscovery } from '@/components/features/community';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Community | Wild 'n Out',
  description: 'Connect with the Wild 'n Out community and share your content',
};

export default function CommunityPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = typeof searchParams.tab === 'string' ? searchParams.tab : 'feed';
  const filter = typeof searchParams.filter === 'string' ? searchParams.filter : 'all';
  const sort = typeof searchParams.sort === 'string' && ['recent', 'popular'].includes(searchParams.sort)
    ? searchParams.sort as 'recent' | 'popular'
    : 'recent';

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-display text-hype-white mb-6">Community</h1>
      
      <Tabs defaultValue={tab} className="space-y-8">
        <TabsList className="bg-zinc-800/50">
          <TabsTrigger value="feed">Content Feed</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>
        
        <TabsContent value="feed" className="space-y-6">
          <p className="text-zinc-300 max-w-3xl">
            Check out the latest content from the Wild 'n Out community. Drop your bars, share your battles, and engage with other creators!
          </p>
          
          <ContentFeed
            initialFilter={filter}
            initialSort={sort as 'recent' | 'popular'}
          />
        </TabsContent>
        
        <TabsContent value="discover" className="space-y-6">
          <p className="text-zinc-300 max-w-3xl">
            Discover trending topics, connect with popular creators, and explore curated content collections.
          </p>
          
          <ContentDiscovery />
        </TabsContent>
      </Tabs>
    </div>
  );
}
