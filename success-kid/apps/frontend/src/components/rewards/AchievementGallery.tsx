'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Award, Lock, CheckCircle, Trophy, Share2, TrendingUp } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AchievementGalleryProps {
  achievements: any[];
  unlockedAchievements: any[];
  isLoading: boolean;
}

export function AchievementGallery({ 
  achievements, 
  unlockedAchievements, 
  isLoading 
}: AchievementGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filteredAchievements, setFilteredAchievements] = useState<any[]>([]);
  const prefersReducedMotion = useReducedMotion();
  
  // Generate mock achievements data if not provided
  const generateMockAchievements = () => {
    if (achievements && achievements.length > 0) return achievements;
    
    const mockCategories = [
      'content_creation', 
      'community_engagement', 
      'platform_milestones', 
      'token_holder',
      'referral_program'
    ];
    
    const mockDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    
    const mockAchievements = [];
    
    // Generate 25 achievements
    for (let i = 1; i <= 25; i++) {
      const category = mockCategories[Math.floor(Math.random() * mockCategories.length)];
      const difficulty = mockDifficulties[Math.floor(Math.random() * mockDifficulties.length)];
      const pointsReward = [50, 100, 250, 500, 1000][Math.floor(Math.random() * 5)];
      
      // Distribute some completed achievements
      const progress = i <= 10 ? 100 : Math.floor(Math.random() * 100);
      const isUnlocked = progress === 100;
      const unlockDate = isUnlocked ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined;
      
      mockAchievements.push({
        id: `achievement-${i}`,
        name: getAchievementName(category, difficulty, i),
        description: getAchievementDescription(category, difficulty, i),
        category,
        difficulty,
        pointsReward,
        progress,
        isUnlocked,
        unlockDate,
        image: `/achievements/${category}-${i % 5 + 1}.png`
      });
    }
    
    return mockAchievements;
  };
  
  const getAchievementName = (category: string, difficulty: string, index: number) => {
    const names = {
      content_creation: [
        'First Post', 'Content Creator', 'Media Master', 'Viral Sensation', 'Trendsetter'
      ],
      community_engagement: [
        'First Comment', 'Conversation Starter', 'Community Pillar', 'Engagement Expert', 'Community Leader'
      ],
      platform_milestones: [
        'Early Adopter', 'Regular Visitor', 'Platform Veteran', 'Daily Devotion', 'Platform Champion'
      ],
      token_holder: [
        'Token Curious', 'Token Holder', 'Token Enthusiast', 'Token Advocate', 'Token Whale'
      ],
      referral_program: [
        'First Referral', 'Network Builder', 'Community Expander', 'Referral Machine', 'Recruitment Legend'
      ]
    };
    
    const categoryNames = names[category as keyof typeof names] || names.content_creation;
    const difficultyIndex = ['beginner', 'intermediate', 'advanced', 'expert'].indexOf(difficulty);
    
    return categoryNames[Math.min(difficultyIndex, categoryNames.length - 1)];
  };
  
  const getAchievementDescription = (category: string, difficulty: string, index: number) => {
    const descriptions = {
      content_creation: [
        'Create your first post on the platform',
        'Create 10 posts that receive engagement',
        'Publish content with multiple media types',
        'Have a post reach 100+ upvotes',
        'Create content that starts a platform trend'
      ],
      community_engagement: [
        'Leave your first comment on the platform',
        'Start 5 conversations on different posts',
        'Engage with the community for 30 consecutive days',
        'Receive 50 comment upvotes across the platform',
        'Have one of your comments pinned by a post creator'
      ],
      platform_milestones: [
        'Join the Success Kid community in its early stages',
        'Log in to the platform for 7 consecutive days',
        'Maintain activity on the platform for 3 months',
        'Complete at least one activity every day for 30 days',
        'Participate in every aspect of the platform ecosystem'
      ],
      token_holder: [
        'Connect your wallet to the platform',
        'Hold at least 100 SKC tokens in your wallet',
        'Maintain a balance of 1,000+ SKC for 30 days',
        'Participate in platform governance with your tokens',
        'Hold 10,000+ SKC tokens in your wallet'
      ],
      referral_program: [
        'Refer your first friend to the platform',
        'Have 5 successful referrals join the platform',
        'Refer 10 users who remain active for 30+ days',
        'Generate 25 successful referrals',
        'Refer 50 users to the Success Kid platform'
      ]
    };
    
    const categoryDescriptions = descriptions[category as keyof typeof descriptions] || descriptions.content_creation;
    const difficultyIndex = ['beginner', 'intermediate', 'advanced', 'expert'].indexOf(difficulty);
    
    return categoryDescriptions[Math.min(difficultyIndex, categoryDescriptions.length - 1)];
  };
  
  // Generate achievements data if needed
  // Use useMemo to prevent regenerating on every render
  const achievementsData = React.useMemo(() => generateMockAchievements(), [achievements]);
  
  // Apply filters when tab or search changes
  useEffect(() => {
    let filtered = [...achievementsData];
    
    // Apply category filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(achievement => achievement.category === activeTab);
    }
    
    // Apply unlocked filter
    if (activeTab === 'unlocked') {
      filtered = filtered.filter(achievement => achievement.isUnlocked);
    }
    
    // Apply in progress filter
    if (activeTab === 'in-progress') {
      filtered = filtered.filter(achievement => achievement.progress > 0 && achievement.progress < 100);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(achievement => 
        achievement.name.toLowerCase().includes(term) || 
        achievement.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredAchievements(filtered);
  }, [achievementsData, activeTab, searchTerm]);
  
  // Format category name
  const formatCategoryName = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Format difficulty name
  const formatDifficulty = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
  };
  
  // Format unlock date
  const formatUnlockDate = (date: Date) => {
    if (!date) return 'Not unlocked';
    
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Calculate overall achievement progress
  const overallProgress = useMemo(() => {
    if (!achievementsData.length) return 0;
    
    const unlockedCount = achievementsData.filter(a => a.isUnlocked).length;
    return Math.round((unlockedCount / achievementsData.length) * 100);
  }, [achievementsData]);
  
  // Calculate category progress
  const categoryProgress = useMemo(() => {
    if (!achievementsData.length) return {};
    
    const categories = [...new Set(achievementsData.map(a => a.category))];
    
    return categories.reduce((acc, category) => {
      const categoryAchievements = achievementsData.filter(a => a.category === category);
      const unlockedCount = categoryAchievements.filter(a => a.isUnlocked).length;
      const percentage = Math.round((unlockedCount / categoryAchievements.length) * 100);
      
      return {
        ...acc,
        [category]: {
          total: categoryAchievements.length,
          unlocked: unlockedCount,
          percentage
        }
      };
    }, {});
  }, [achievementsData]);
  
  // Animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Achievement Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Overall Completion</span>
                  <span className="text-sm font-medium">{overallProgress}%</span>
                </div>
                <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-neutral-500">
                  <span>{achievementsData.filter(a => a.isUnlocked).length} of {achievementsData.length} unlocked</span>
                  {achievementsData.filter(a => !a.isUnlocked).length > 0 && (
                    <span>{achievementsData.filter(a => !a.isUnlocked).length} to go</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Achievements */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : achievementsData.filter(a => a.isUnlocked).length === 0 ? (
              <div className="text-center py-2">
                <p className="text-sm text-neutral-500">No achievements unlocked yet</p>
                <p className="text-xs text-neutral-400 mt-1">Start engaging with the platform to earn achievements</p>
              </div>
            ) : (
              <div className="space-y-3">
                {achievementsData
                  .filter(a => a.isUnlocked)
                  .sort((a, b) => new Date(b.unlockDate).getTime() - new Date(a.unlockDate).getTime())
                  .slice(0, 3)
                  .map((achievement, index) => (
                    <div key={achievement.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center">
                        <Award className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{achievement.name}</div>
                        <div className="text-xs text-neutral-500">
                          {formatUnlockDate(achievement.unlockDate)}
                        </div>
                      </div>
                    </div>
                  ))}
                {achievementsData.filter(a => a.isUnlocked).length > 3 && (
                  <div className="text-xs text-primary text-center pt-1">
                    + {achievementsData.filter(a => a.isUnlocked).length - 3} more achievements
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Next Achievements */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Next Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-3 w-full mt-2" />
                  </div>
                ))}
              </div>
            ) : achievementsData.filter(a => !a.isUnlocked && a.progress > 0).length === 0 ? (
              <div className="text-center py-2">
                <p className="text-sm text-neutral-500">No achievements in progress</p>
                <p className="text-xs text-neutral-400 mt-1">Start working towards your next achievements</p>
              </div>
            ) : (
              <div className="space-y-3">
                {achievementsData
                  .filter(a => !a.isUnlocked && a.progress > 0)
                  .sort((a, b) => b.progress - a.progress)
                  .slice(0, 3)
                  .map((achievement, index) => (
                    <div key={achievement.id} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-sm">{achievement.name}</div>
                        <div className="text-xs font-medium">{achievement.progress}%</div>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${achievement.progress}%` }}
                          transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                {achievementsData.filter(a => !a.isUnlocked && a.progress > 0).length > 3 && (
                  <div className="text-xs text-primary text-center pt-1">
                    + {achievementsData.filter(a => !a.isUnlocked && a.progress > 0).length - 3} more in progress
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Achievement Gallery */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Achievement Gallery</CardTitle>
              <CardDescription>Discover and track your progress on all platform achievements</CardDescription>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Input
                type="text"
                placeholder="Search achievements..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            </div>
          </div>
          
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="mt-6"
          >
            <TabsList className="grid grid-cols-3 sm:grid-cols-7 md:w-fit w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="content_creation">Content</TabsTrigger>
              <TabsTrigger value="community_engagement">Community</TabsTrigger>
              <TabsTrigger value="platform_milestones">Platform</TabsTrigger>
              <TabsTrigger value="token_holder">Token</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, index) => (
                <Card key={index} className="border border-neutral-200">
                  <div className="aspect-square bg-neutral-100">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredAchievements.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-neutral-400 mx-auto rounded-full bg-neutral-100 p-3 w-12 h-12 flex items-center justify-center">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium mt-4">No achievements found</h3>
              <p className="text-neutral-500 max-w-sm mx-auto mt-2">
                Try adjusting your search or filters to see more achievements.
              </p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              variants={prefersReducedMotion ? {} : containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredAchievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  variants={prefersReducedMotion ? {} : itemVariants}
                  className="group"
                >
                  <Card className={`border overflow-hidden h-full transition-all duration-200 
                    ${achievement.isUnlocked 
                      ? 'border-primary-200 hover:border-primary' 
                      : 'border-neutral-200 hover:border-neutral-400'}`}
                  >
                    {/* Achievement image or icon */}
                    <div className={`aspect-square flex items-center justify-center relative 
                      ${achievement.isUnlocked ? 'bg-primary-50' : 'bg-neutral-50'}`}
                    >
                      {achievement.isUnlocked ? (
                        <Award className="h-20 w-20 text-primary" />
                      ) : (
                        <Lock className="h-16 w-16 text-neutral-300" />
                      )}
                      
                      {/* Difficulty Badge */}
                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium 
                        ${achievement.difficulty === 'beginner' && 'bg-green-100 text-green-800'}
                        ${achievement.difficulty === 'intermediate' && 'bg-blue-100 text-blue-800'}
                        ${achievement.difficulty === 'advanced' && 'bg-purple-100 text-purple-800'} 
                        ${achievement.difficulty === 'expert' && 'bg-red-100 text-red-800'}`}
                      >
                        {formatDifficulty(achievement.difficulty)}
                      </div>
                      
                      {/* Category Badge */}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-white/80 rounded text-xs font-medium text-neutral-800">
                        {formatCategoryName(achievement.category)}
                      </div>
                      
                      {/* Unlocked Badge */}
                      {achievement.isUnlocked && (
                        <div className="absolute top-2 left-2 bg-primary text-white rounded-full p-1">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    
                    {/* Achievement details */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold">{achievement.name}</h3>
                      <p className="text-sm text-neutral-600">{achievement.description}</p>
                      
                      {/* Progress bar for locked achievements */}
                      {!achievement.isUnlocked && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-neutral-500">Progress</span>
                            <span className="font-medium">{achievement.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-primary rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${achievement.progress}%` }}
                              transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Unlock date or points reward */}
                      <div className="flex justify-between items-center pt-1 text-xs">
                        {achievement.isUnlocked ? (
                          <span className="text-neutral-500">
                            Unlocked: {formatUnlockDate(achievement.unlockDate)}
                          </span>
                        ) : (
                          <span className="text-neutral-500">
                            Reward: {achievement.pointsReward} SP
                          </span>
                        )}
                        
                        {/* Share button for unlocked achievements */}
                        {achievement.isUnlocked && (
                          <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <Share2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
