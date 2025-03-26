'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ContentType } from '@/types/community';
import { 
  Search, 
  Image, 
  AlignLeft, 
  Link, 
  BarChart2, 
  Info, 
  Copy, 
  Download, 
  Check, 
  Plus 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for resources
interface ResourceItem {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  category: string;
  thumbnail?: string;
  content: string;
  tags: string[];
}

// Mock resources data
const MOCK_RESOURCES: ResourceItem[] = [
  {
    id: 'res_text_1',
    title: 'Welcome Introduction',
    description: 'A friendly introduction post for new community members',
    type: 'text',
    category: 'templates',
    content: '<p>👋 Hello Success Kid community!</p><p>I\'m excited to join this vibrant community. I\'ve been interested in [your interest] for [time period], and I\'m looking forward to connecting with like-minded individuals here.</p><p>What are some of your favorite discussions on the platform so far?</p>',
    tags: ['introduction', 'new member', 'welcome']
  },
  {
    id: 'res_text_2',
    title: 'Market Update',
    description: 'Template for sharing market insights and analysis',
    type: 'text',
    category: 'templates',
    content: '<p>📊 <strong>Market Update</strong> - [Date]</p><p>Current price: $[price]<br>24h change: [percentage]%<br>Market cap: $[marketcap]</p><p>Key observations:</p><ul><li>[Observation 1]</li><li>[Observation 2]</li></ul><p>What\'s your take on these developments?</p>',
    tags: ['market', 'analysis', 'update']
  },
  {
    id: 'res_text_3',
    title: 'Achievement Celebration',
    description: 'Share your achievements with the community',
    type: 'text',
    category: 'templates',
    content: '<p>🎉 <strong>Achievement Unlocked!</strong></p><p>I\'m thrilled to share that I just [achieved something]. This has been a goal of mine for [time period].</p><p>The journey included [challenges faced] but I persevered by [how you overcame them].</p><p>Have you had any recent wins you\'d like to celebrate?</p>',
    tags: ['achievement', 'celebration', 'success']
  },
  {
    id: 'res_image_1',
    title: 'Success Kid Meme Template',
    description: 'Classic Success Kid meme template for customization',
    type: 'image',
    category: 'memes',
    thumbnail: '/images/resources/success-kid-template.jpg',
    content: '<p>Classic Success Kid meme template</p>',
    tags: ['meme', 'template', 'success kid']
  },
  {
    id: 'res_image_2',
    title: 'Chart Background',
    description: 'Clean chart background for price analysis',
    type: 'image',
    category: 'graphics',
    thumbnail: '/images/resources/chart-background.jpg',
    content: '<p>Chart background for technical analysis</p>',
    tags: ['chart', 'analysis', 'background']
  },
  {
    id: 'res_poll_1',
    title: 'Community Preferences Poll',
    description: 'Discover what the community enjoys most',
    type: 'poll',
    category: 'engagement',
    content: '<p>What aspect of the Success Kid platform do you enjoy the most?</p>',
    tags: ['poll', 'feedback', 'community']
  },
  {
    id: 'res_link_1',
    title: 'Share Crypto News',
    description: 'Template for sharing and discussing crypto news',
    type: 'link',
    category: 'templates',
    content: '<p>📰 <strong>Interesting Crypto News</strong></p><p>I found this article thought-provoking, especially the part about [key point].</p><p>What are your thoughts on this development?</p>',
    tags: ['news', 'crypto', 'discussion']
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Resources', icon: <Info className="w-4 h-4" /> },
  { id: 'templates', label: 'Text Templates', icon: <AlignLeft className="w-4 h-4" /> },
  { id: 'memes', label: 'Memes & Media', icon: <Image className="w-4 h-4" /> },
  { id: 'engagement', label: 'Engagement Tools', icon: <BarChart2 className="w-4 h-4" /> }
];

interface ResourcesLibraryProps {
  onSelectResource: (resource: ResourceItem) => void;
  currentContentType: ContentType;
}

export function ResourcesLibrary({ onSelectResource, currentContentType }: ResourcesLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [filteredResources, setFilteredResources] = useState<ResourceItem[]>([]);
  const [resourceDetailOpen, setResourceDetailOpen] = useState<string | null>(null);

  // Filter resources based on search, category, and content type
  useEffect(() => {
    let filtered = MOCK_RESOURCES;
    
    // Filter by content type
    if (currentContentType) {
      filtered = filtered.filter(resource => resource.type === currentContentType);
    }
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === activeCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(resource => 
        resource.title.toLowerCase().includes(query) || 
        resource.description.toLowerCase().includes(query) ||
        resource.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredResources(filtered);
  }, [searchQuery, activeCategory, currentContentType]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search resources..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="mb-6 flex flex-wrap">
          {CATEGORIES.map(category => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="flex items-center gap-2"
            >
              {category.icon}
              <span>{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={activeCategory} className="mt-0">
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map(resource => (
                <div key={resource.id}>
                  {resourceDetailOpen === resource.id ? (
                    <ResourceDetail
                      resource={resource}
                      onClose={() => setResourceDetailOpen(null)}
                      onUse={() => {
                        onSelectResource(resource);
                        setResourceDetailOpen(null);
                      }}
                    />
                  ) : (
                    <ResourceCard 
                      resource={resource} 
                      onClick={() => setResourceDetailOpen(resource.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-md">
              <p className="text-gray-500">No resources found matching your criteria</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ResourceCardProps {
  resource: ResourceItem;
  onClick: () => void;
}

function ResourceCard({ resource, onClick }: ResourceCardProps) {
  // Helper to get the appropriate icon based on content type
  const getTypeIcon = () => {
    switch (resource.type) {
      case 'text': return <AlignLeft className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'link': return <Link className="w-4 h-4" />;
      case 'poll': return <BarChart2 className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:border-primary transition-colors cursor-pointer h-full"
      onClick={onClick}
    >
      {resource.thumbnail && (
        <div className="h-32 overflow-hidden">
          <img 
            src={resource.thumbnail} 
            alt={resource.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-2">
          {getTypeIcon()}
          <span className="text-xs font-medium uppercase text-gray-500">
            {resource.type}
          </span>
        </div>
        <h3 className="font-medium mb-1">{resource.title}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{resource.description}</p>
        <div className="flex flex-wrap gap-1 mt-auto">
          {resource.tags.slice(0, 3).map(tag => (
            <span 
              key={tag} 
              className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

interface ResourceDetailProps {
  resource: ResourceItem;
  onClose: () => void;
  onUse: () => void;
}

function ResourceDetail({ resource, onClose, onUse }: ResourceDetailProps) {
  const [copied, setCopied] = useState(false);
  
  // Function to copy text to clipboard
  const copyToClipboard = async () => {
    try {
      // Extract plain text from HTML content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = resource.content;
      const textContent = tempDiv.textContent || tempDiv.innerText;
      
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };
  
  // Function to download media
  const downloadMedia = async () => {
    if (!resource.thumbnail) return;
    
    try {
      const response = await fetch(resource.thumbnail);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${resource.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download: ', err);
    }
  };
  
  // Parse HTML content safely
  const createMarkup = () => {
    return { __html: resource.content };
  };
  
  return (
    <Card className="overflow-hidden h-full">
      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-medium text-lg">{resource.title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1 h-auto">
            <Info className="w-4 h-4" />
          </Button>
        </div>
        
        {resource.thumbnail && (
          <div className="mb-4 rounded-md overflow-hidden">
            <img 
              src={resource.thumbnail} 
              alt={resource.title} 
              className="w-full object-cover"
            />
          </div>
        )}
        
        <div className="mb-4 flex-grow overflow-auto">
          {resource.type === 'text' || resource.type === 'link' || resource.type === 'poll' ? (
            <div 
              className="prose prose-sm max-w-none p-3 border rounded-md bg-gray-50"
              dangerouslySetInnerHTML={createMarkup()}
            />
          ) : null}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {resource.tags.map(tag => (
            <span 
              key={tag} 
              className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-auto">
          {(resource.type === 'text' || resource.type === 'link' || resource.type === 'poll') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={copyToClipboard}
              className={cn(
                "transition-all",
                copied ? "bg-green-50 text-green-600 border-green-200" : ""
              )}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Text
                </>
              )}
            </Button>
          )}
          
          {resource.thumbnail && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={downloadMedia}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
          
          <Button 
            variant="primary" 
            size="sm"
            className="ml-auto"
            onClick={onUse}
          >
            <Plus className="w-4 h-4 mr-2" />
            Use in Post
          </Button>
        </div>
      </div>
    </Card>
  );
}
