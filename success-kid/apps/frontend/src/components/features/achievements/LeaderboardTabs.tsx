'use client';

import React from 'react';
import { LeaderboardPeriod, LeaderboardCategory } from '@/store/useLeaderboardStore';

/**
 * Props for LeaderboardTabs component
 */
interface LeaderboardTabsProps {
  activeTab: LeaderboardPeriod;
  onTabChange: (tab: LeaderboardPeriod) => void;
  className?: string;
}

/**
 * Time period selection tabs for the leaderboard
 */
export function LeaderboardTabs({
  activeTab,
  onTabChange,
  className = '',
}: LeaderboardTabsProps) {
  // Define tabs
  const tabs: Array<{ id: LeaderboardPeriod; label: string }> = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'all-time', label: 'All Time' },
  ];

  return (
    <div className={`border-b border-neutral-200 ${className}`}>
      <nav className="-mb-px flex space-x-4" aria-label="Leaderboard periods">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              whitespace-nowrap py-3 px-3 border-b-2 font-medium text-sm
              ${activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}
              transition-colors duration-200
            `}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

/**
 * Props for LeaderboardCategorySelector component
 */
interface LeaderboardCategorySelectorProps {
  activeCategory: LeaderboardCategory;
  onCategoryChange: (category: LeaderboardCategory) => void;
  className?: string;
}

/**
 * Category selector for the leaderboard
 */
export function LeaderboardCategorySelector({
  activeCategory,
  onCategoryChange,
  className = '',
}: LeaderboardCategorySelectorProps) {
  // Define categories
  const categories: Array<{ id: LeaderboardCategory; label: string }> = [
    { id: 'points', label: 'Points' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'content', label: 'Content' },
    { id: 'referrals', label: 'Referrals' },
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-colors
            ${activeCategory === category.id
              ? 'bg-primary-500 text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}
          `}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
