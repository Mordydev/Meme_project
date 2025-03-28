'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, At,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Tag, Users, BookOpen, CheckCircle } from 'lucide-react';
import { FeedPreferences } from '@/types/activity-feed';

interface Interest {
  id: string;
  name: string;
  description?: string;
}

interface FeedPersonalizationProps {
  preferences: FeedPreferences;
  onPreferencesChanged: (prefs: FeedPreferences) => void;
}

export function FeedPersonalization({
  preferences,
  onPreferencesChanged
}: FeedPersonalizationProps) {
  const [localPreferences, setLocalPreferences] = useState<FeedPreferences>(preferences);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Reset local preferences when parent preferences change
  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);
  
  // Sample interests - in a real app, these would come from an API
  const availableInterests: Interest[] = [
    { id: 'crypto', name: 'Cryptocurrency', description: 'Blockchain, tokens, and trading' },
    { id: 'community', name: 'Community', description: 'Connection, engagement, and collaboration' },
    { id: 'memes', name: 'Memes', description: 'Humor, jokes, and viral content' },
    { id: 'technology', name: 'Technology', description: 'Latest tech news and innovations' },
    { id: 'success', name: 'Success Stories', description: 'Personal achievements and wins' },
    { id: 'tokenomics', name: 'Tokenomics', description: 'Token economics and market analysis' },
    { id: 'web3', name: 'Web3', description: 'Decentralized web technologies' },
    { id: 'defi', name: 'DeFi', description: 'Decentralized finance' }
  ];
  
  // Sample followed users - in a real app, these would come from API
  const followedUsers = [
    { id: 'user1', username: 'crypto_enthusiast', displayName: 'Crypto Enthusiast' },
    { id: 'user2', username: 'success_kid_fan', displayName: 'Success Kid Fan' },
    { id: 'user3', username: 'meme_creator', displayName: 'Meme Creator' }
  ];
  
  // Content type options
  const contentTypeOptions = [
    { id: 'post', label: 'Posts', description: 'Text-based discussions and updates' },
    { id: 'media', label: 'Media', description: 'Images, videos, and visual content' },
    { id: 'link', label: 'Links', description: 'Shared articles and external content' },
    { id: 'activity', label: 'Activity', description: 'Community member actions' },
    { id: 'achievement', label: 'Achievements', description: 'Celebration of milestones' }
  ];
  
  // Handler for interest selection
  const toggleInterest = (interestId: string) => {
    setLocalPreferences(prev => {
      if (prev.interests.includes(interestId)) {
        return { ...prev, interests: prev.interests.filter(id => id !== interestId) };
      } else {
        return { ...prev, interests: [...prev.interests, interestId] };
      }
    });
  };
  
  // Handler for content type selection
  const toggleContentType = (typeId: string) => {
    setLocalPreferences(prev => {
      if (prev.contentTypes.includes(typeId)) {
        return { ...prev, contentTypes: prev.contentTypes.filter(id => id !== typeId) };
      } else {
        return { ...prev, contentTypes: [...prev.contentTypes, typeId] };
      }
    });
  };
  
  // Handler for view mode toggle
  const toggleViewMode = () => {
    setLocalPreferences(prev => ({
      ...prev,
      viewMode: prev.viewMode === 'standard' ? 'compact' : 'standard'
    }));
  };
  
  // Save preferences
  const savePreferences = () => {
    setSaving(true);
    
    // In a real app, this would be an API call
    setTimeout(() => {
      onPreferencesChanged(localPreferences);
      setSaving(false);
      setIsSaved(true);
      
      // Reset saved indicator after 3 seconds
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    }, 600);
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings size={16} />
          Customize Feed
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Your Feed</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="interests" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="interests" className="flex items-center gap-1">
              <Tag size={14} /> Interests
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-1">
              <Users size={14} /> Following
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-1">
              <BookOpen size={14} /> Display
            </TabsTrigger>
          </TabsList>
          
          {/* Interests Tab */}
          <TabsContent value="interests" className="pt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select topics you're interested in to personalize your feed content
              </p>
              
              <div className="flex flex-wrap gap-2">
                {availableInterests.map(interest => (
                  <Badge
                    key={interest.id}
                    variant={localPreferences.interests.includes(interest.id) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-90 transition-colors"
                    onClick={() => toggleInterest(interest.id)}
                  >
                    {interest.name}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Following Tab */}
          <TabsContent value="following" className="pt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Content from people you follow will appear more in your feed
              </p>
              
              <div className="space-y-2">
                {followedUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <Switch
                      checked={localPreferences.followedUsers.includes(user.id)}
                      onCheckedChange={() => {
                        setLocalPreferences(prev => {
                          if (prev.followedUsers.includes(user.id)) {
                            return { ...prev, followedUsers: prev.followedUsers.filter(id => id !== user.id) };
                          } else {
                            return { ...prev, followedUsers: [...prev.followedUsers, user.id] };
                          }
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                Find More People to Follow
              </Button>
            </div>
          </TabsContent>
          
          {/* Display Tab */}
          <TabsContent value="display" className="pt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Customize how content appears in your feed
              </p>
              
              {/* View Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compact-mode" className="font-medium">Compact Mode</Label>
                  <p className="text-xs text-muted-foreground">Show more content with condensed view</p>
                </div>
                <Switch
                  id="compact-mode"
                  checked={localPreferences.viewMode === 'compact'}
                  onCheckedChange={toggleViewMode}
                />
              </div>
              
              {/* Content Types */}
              <div className="space-y-3">
                <Label className="font-medium">Content Types</Label>
                
                {contentTypeOptions.map(type => (
                  <div key={type.id} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                    <Switch
                      checked={localPreferences.contentTypes.includes(type.id)}
                      onCheckedChange={() => toggleContentType(type.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button 
            onClick={savePreferences} 
            disabled={saving}
            className="relative"
          >
            {saving ? (
              'Saving...'
            ) : isSaved ? (
              <span className="flex items-center gap-1">
                <CheckCircle size={16} /> Saved
              </span>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
