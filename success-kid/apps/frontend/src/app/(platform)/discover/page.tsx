'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DiscoveryFeed } from '@/components/features/search/DiscoveryFeed';
import { UserRecommendations } from '@/components/features/search/UserRecommendations';
import { CategoryExplorer } from '@/components/features/search/CategoryExplorer';
import { GlobalSearch } from '@/components/features/search/GlobalSearch';

export default function DiscoverPage() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'users' | 'categories'>('feed');
  
  // Sample interests
  const popularInterests = [
    'Tokenomics', 'Community', 'Success Stories', 'Guides', 
    'Memes', 'Analysis', 'Crypto', 'Achievements'
  ];
  
  // Toggle interest selection
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="mt-2 text-neutral-500">
          Explore content, users, and categories that match your interests
        </p>
      </div>
      
      {/* Search bar */}
      <div className="mb-8">
        <GlobalSearch 
          showShortcuts={true}
          className="max-w-2xl mx-auto"
        />
      </div>
      
      {/* Interests filter */}
      <div className="mb-8">
        <div className="mb-2 text-center text-sm font-medium text-neutral-500">
          Filter by interest
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {popularInterests.map((interest) => (
            <button
              key={interest}
              className={`rounded-full px-3 py-1 text-sm transition ${
                selectedInterests.includes(interest)
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>
      
      {/* Navigation tabs */}
      <div className="mb-6 flex justify-center border-b border-neutral-200">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'feed'
              ? 'border-b-2 border-primary text-primary'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
          onClick={() => setActiveTab('feed')}
        >
          For You
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'users'
              ? 'border-b-2 border-primary text-primary'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'categories'
              ? 'border-b-2 border-primary text-primary'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
      </div>
      
      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <h2 className="mb-4 text-xl font-bold">Recommended Content</h2>
              <DiscoveryFeed
                interests={selectedInterests}
                limit={10}
              />
            </div>
            <div>
              <h2 className="mb-4 text-xl font-bold">Suggested Users</h2>
              <UserRecommendations
                limit={5}
                excludeFollowing={true}
              />
              
              <div className="mt-8">
                <h2 className="mb-4 text-xl font-bold">Trending Topics</h2>
                <div className="rounded-lg border border-neutral-200 bg-background p-4">
                  <ul className="space-y-3">
                    {['Success Token Updates', 'Community Milestones', 'Tokenomics Discussion', 'Meme Contest', 'Achievement Guides'].map((topic, index) => (
                      <li key={index}>
                        <a href={`/search?q=${encodeURIComponent(topic)}`} className="flex items-center">
                          <span className="mr-2 text-neutral-400">#{index + 1}</span>
                          <span className="text-primary hover:underline">{topic}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/trends'}>
                      View all trends
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'users' && (
          <div>
            <h2 className="mb-4 text-xl font-bold">Suggested Users</h2>
            <UserRecommendations
              limit={20}
              excludeFollowing={true}
            />
          </div>
        )}
        
        {activeTab === 'categories' && (
          <div>
            <h2 className="mb-4 text-xl font-bold">Browse by Category</h2>
            <CategoryExplorer />
          </div>
        )}
      </div>
    </div>
  );
}
