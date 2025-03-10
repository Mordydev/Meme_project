import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InteractionBar, CommentThread } from '@/components/features/community';

// This would be replaced with an actual API call
async function getContent(id: string) {
  // For development, return mock data
  return {
    id,
    type: ['post', 'battle', 'image', 'video'][Math.floor(Math.random() * 4)],
    title: `Content ${id}`,
    body: `This is detailed content for item ${id}. This is a longer form of content that would typically be displayed on a detailed view page. The content might include several paragraphs of text, media elements, and other information depending on the content type.
    
In the case of a battle submission, this might include the full bars or creative content submitted for the battle. For a discussion post, it might include the full text of the discussion topic.`,
    authorId: `user-${Math.floor(Math.random() * 10) + 1}`,
    author: {
      id: `user-${Math.floor(Math.random() * 10) + 1}`,
      username: [`CreativeMC`, `BattleKing`, `FunnyGuy`, `RhymeQueen`, `WildStar`][Math.floor(Math.random() * 5)],
      avatarUrl: `/avatars/user-${Math.floor(Math.random() * 5) + 1}.jpg`,
    },
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 604800000)).toISOString(),
    metrics: {
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 30),
      shares: Math.floor(Math.random() * 15),
    },
    tags: ['funny', 'battle', 'rhyme', 'creative'].slice(0, Math.floor(Math.random() * 4) + 1),
    mediaUrl: Math.random() > 0.3 ? `/sample-media/content-${Math.floor(Math.random() * 5) + 1}.jpg` : null,
    comments: Array.from({ length: Math.floor(Math.random() * 5) + 1 }).map((_, i) => ({
      id: `comment-${id}-${i + 1}`,
      contentId: id,
      authorId: `user-${Math.floor(Math.random() * 10) + 1}`,
      author: {
        id: `user-${Math.floor(Math.random() * 10) + 1}`,
        username: [`CreativeMC`, `BattleKing`, `FunnyGuy`, `RhymeQueen`, `WildStar`][Math.floor(Math.random() * 5)],
        avatarUrl: `/avatars/user-${Math.floor(Math.random() * 5) + 1}.jpg`,
      },
      text: `This is comment ${i + 1} on content ${id}. This would be actual user-generated comment text.`,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
      likes: Math.floor(Math.random() * 20),
    })),
  };
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Fetch content data
  const content = await getContent(params.id);
  
  return {
    title: content.title ? `${content.title} | Community | Wild 'n Out` : 'Content | Wild 'n Out',
    description: content.body ? content.body.slice(0, 160) : 'View community content on Wild 'n Out',
  };
}

export default async function ContentDetailPage({ params }: { params: { id: string } }) {
  const content = await getContent(params.id);
  const formattedDate = formatDistanceToNow(new Date(content.createdAt), { addSuffix: true });
  
  // Determine content type badge
  const getContentTypeBadge = () => {
    switch(content.type) {
      case 'battle':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-battle-yellow/20 text-battle-yellow">
            Battle
          </span>
        );
      case 'image':
      case 'video':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-flow-blue/20 text-flow-blue">
            {content.type === 'image' ? 'Image' : 'Video'}
          </span>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/community" className="flex items-center text-zinc-400 hover:text-hype-white transition-colors">
          <span className="mr-2">←</span>
          Back to Community
        </Link>
      </div>
      
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6">
          {/* Author info */}
          <div className="flex items-center mb-6">
            <Avatar
              src={content.author.avatarUrl || undefined}
              alt={content.author.username}
              fallback={content.author.username.charAt(0).toUpperCase()}
              className="mr-3 h-10 w-10"
            />
            <div>
              <Link
                href={`/profile/${content.author.id}`}
                className="font-medium text-hype-white hover:text-battle-yellow transition-colors"
              >
                {content.author.username}
              </Link>
              <div className="text-xs text-zinc-400">{formattedDate}</div>
            </div>
            {getContentTypeBadge() && (
              <div className="ml-auto">{getContentTypeBadge()}</div>
            )}
          </div>
          
          {/* Content title */}
          {content.title && (
            <h1 className="text-2xl sm:text-3xl font-display text-hype-white mb-4">
              {content.title}
            </h1>
          )}
          
          {/* Content body */}
          <div className="mb-6">
            <div className="text-zinc-200 whitespace-pre-line">{content.body}</div>
          </div>
          
          {/* Media content if available */}
          {content.mediaUrl && (
            <div className="relative mb-6 rounded-md overflow-hidden">
              {content.type === 'image' ? (
                <Image
                  src={content.mediaUrl}
                  alt={content.title || 'Content image'}
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover rounded-md"
                />
              ) : content.type === 'video' ? (
                <video
                  src={content.mediaUrl}
                  controls
                  className="w-full h-auto rounded-md"
                />
              ) : null}
            </div>
          )}
          
          {/* Tags if any */}
          {content.tags && content.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {content.tags.map(tag => (
                <Link 
                  key={tag} 
                  href={`/community?filter=tag&tag=${tag}`}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
          
          {/* Interaction bar */}
          <div className="mb-8">
            <InteractionBar
              contentId={content.id}
              metrics={content.metrics}
              contentType={content.type}
            />
          </div>
          
          {/* Battle action if applicable */}
          {content.type === 'battle' && (
            <div className="mb-8 text-center">
              <Link href={`/battle/${content.id}`} passHref>
                <Button size="lg" className="px-8">
                  View Full Battle
                </Button>
              </Link>
            </div>
          )}
          
          {/* Comments section */}
          <div className="pt-6 border-t border-zinc-700">
            <CommentThread
              contentId={content.id}
              initialComments={content.comments}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
