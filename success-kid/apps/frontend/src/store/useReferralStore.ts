import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

export interface ReferralUser {
  userId: string;
  username: string;
  avatarUrl?: string;
  registeredAt: string;
  convertedAt?: string;
  status: 'pending' | 'active' | 'converted';
  pointsGenerated: number;
  lastActive?: string;
}

export interface ReferralStatistics {
  totalReferrals: number;
  convertedReferrals: number;
  pendingReferrals: number;
  conversionRate: number;
  pointsEarned: number;
}

export interface TimelineItem {
  period: string;
  referrals: number;
  conversions: number;
  points: number;
}

export interface ReferralCampaign {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  bonusReward: number;
  referrerReward: number;
  refereeReward: number;
  isActive: boolean;
}

interface ReferralState {
  // Core referral data
  referralCode: string;
  referralLink: string;
  isCodeLoading: boolean;
  
  // Statistics
  statistics: ReferralStatistics;
  isStatsLoading: boolean;
  
  // Referrals list
  referrals: ReferralUser[];
  isReferralsLoading: boolean;
  
  // Timeline data
  timeline: TimelineItem[];
  timeRange: 'week' | 'month' | 'year' | 'all-time';
  
  // Campaigns
  campaigns: ReferralCampaign[];
  isCampaignsLoading: boolean;
  selectedCampaign?: ReferralCampaign;
  campaignReferralLink?: string;
  
  // Used for tracking if current user came through a referral
  isReferral: boolean;
  referrerId?: string;
  
  // Error handling
  error: Error | null;

  // Actions
  fetchReferralCode: () => Promise<void>;
  generateNewCode: () => Promise<void>;
  fetchStatistics: (timeRange?: string) => Promise<void>;
  fetchReferrals: (status?: string, sortBy?: string) => Promise<void>;
  fetchCampaigns: () => Promise<void>;
  selectCampaign: (campaignId: string) => Promise<void>;
  setTimeRange: (range: 'week' | 'month' | 'year' | 'all-time') => void;
  checkReferralCode: (code: string) => Promise<boolean>;
  resetError: () => void;
}

export const useReferralStore = create<ReferralState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        referralCode: '',
        referralLink: '',
        isCodeLoading: false,
        
        statistics: {
          totalReferrals: 0,
          convertedReferrals: 0,
          pendingReferrals: 0,
          conversionRate: 0,
          pointsEarned: 0,
        },
        isStatsLoading: false,
        
        referrals: [],
        isReferralsLoading: false,
        
        timeline: [],
        timeRange: 'month',
        
        campaigns: [],
        isCampaignsLoading: false,
        
        isReferral: false,
        
        error: null,
        
        // Actions
        fetchReferralCode: async () => {
          set({ isCodeLoading: true, error: null });
          
          try {
            // This would be replaced with actual API call
            // For demo, use mock data
            // const response = await apiClient.get('/api/v1/referrals/me');
            
            // Simulated response
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockData = {
              referralCode: 'SUCCESS4U2',
              referralLink: `${window.location.origin}/join?ref=SUCCESS4U2`,
              statistics: {
                totalReferrals: 24,
                convertedReferrals: 15,
                pendingReferrals: 9,
                conversionRate: 62.5,
                pointsEarned: 8500
              },
              isReferral: false,
              referrerId: null
            };
            
            set({
              referralCode: mockData.referralCode,
              referralLink: mockData.referralLink,
              statistics: mockData.statistics,
              isReferral: mockData.isReferral,
              referrerId: mockData.referrerId,
              isCodeLoading: false,
            });
          } catch (error) {
            set({ 
              isCodeLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch referral code')
            });
          }
        },
        
        generateNewCode: async () => {
          set({ isCodeLoading: true, error: null });
          
          try {
            // This would be replaced with actual API call
            // const response = await apiClient.post('/api/v1/referrals/code');
            
            // Simulated response
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockData = {
              referralCode: 'NEWCODE123',
              referralLink: `${window.location.origin}/join?ref=NEWCODE123`,
            };
            
            set({
              referralCode: mockData.referralCode,
              referralLink: mockData.referralLink,
              isCodeLoading: false,
            });
          } catch (error) {
            set({ 
              isCodeLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to generate new referral code')
            });
          }
        },
        
        fetchStatistics: async (timeRange = 'month') => {
          set({ isStatsLoading: true, error: null });
          
          try {
            // This would be replaced with actual API call
            // const response = await apiClient.get(`/api/v1/referrals/analytics?timeRange=${timeRange}`);
            
            // Simulated response
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockData = {
              statistics: {
                totalReferrals: 24,
                convertedReferrals: 15,
                pendingReferrals: 9,
                conversionRate: 62.5,
                pointsEarned: 8500
              },
              timeline: [
                { period: 'Mar 5', referrals: 3, conversions: 2, points: 1000 },
                { period: 'Mar 6', referrals: 5, conversions: 3, points: 1500 },
                { period: 'Mar 7', referrals: 4, conversions: 2, points: 1000 },
                { period: 'Mar 8', referrals: 6, conversions: 4, points: 2000 },
                { period: 'Mar 9', referrals: 2, conversions: 1, points: 500 },
                { period: 'Mar 10', referrals: 4, conversions: 3, points: 1500 },
              ],
            };
            
            set({
              statistics: mockData.statistics,
              timeline: mockData.timeline,
              isStatsLoading: false,
            });
          } catch (error) {
            set({ 
              isStatsLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch referral statistics')
            });
          }
        },
        
        fetchReferrals: async (status = 'all', sortBy = 'date') => {
          set({ isReferralsLoading: true, error: null });
          
          try {
            // This would be replaced with actual API call
            // const response = await apiClient.get(`/api/v1/referrals/users?status=${status}&sortBy=${sortBy}`);
            
            // Simulated response
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockData = {
              referrals: [
                {
                  userId: 'user_123',
                  username: 'activefriend',
                  avatarUrl: '/images/avatars/user1.png',
                  registeredAt: '2025-03-05T14:35:00Z',
                  convertedAt: '2025-03-06T09:12:00Z',
                  status: 'converted',
                  pointsGenerated: 1500,
                  lastActive: '2025-03-12T16:45:00Z',
                },
                {
                  userId: 'user_456',
                  username: 'newmember',
                  avatarUrl: '/images/avatars/user2.png',
                  registeredAt: '2025-03-07T10:22:00Z',
                  status: 'pending',
                  pointsGenerated: 0,
                },
                {
                  userId: 'user_789',
                  username: 'cryptofriend',
                  avatarUrl: '/images/avatars/user3.png',
                  registeredAt: '2025-03-01T08:15:00Z',
                  convertedAt: '2025-03-02T11:30:00Z',
                  status: 'converted',
                  pointsGenerated: 1750,
                  lastActive: '2025-03-11T12:20:00Z',
                },
                {
                  userId: 'user_101',
                  username: 'memefan',
                  avatarUrl: '/images/avatars/user4.png',
                  registeredAt: '2025-03-08T16:40:00Z',
                  status: 'active',
                  pointsGenerated: 250,
                  lastActive: '2025-03-09T14:10:00Z',
                },
              ],
            };
            
            set({
              referrals: mockData.referrals,
              isReferralsLoading: false,
            });
          } catch (error) {
            set({ 
              isReferralsLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch referrals')
            });
          }
        },
        
        fetchCampaigns: async () => {
          set({ isCampaignsLoading: true, error: null });
          
          try {
            // This would be replaced with actual API call
            // const response = await apiClient.get('/api/v1/referrals/campaigns');
            
            // Simulated response
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockData = {
              campaigns: [
                {
                  id: 'campaign_spring',
                  name: 'Spring Referral Boost',
                  description: 'Get 2x points for all referrals during our Spring promotion!',
                  startDate: '2025-03-01T00:00:00Z',
                  endDate: '2025-04-15T23:59:59Z',
                  bonusReward: 500,
                  referrerReward: 1000,
                  refereeReward: 250,
                  isActive: true,
                },
                {
                  id: 'campaign_newuser',
                  name: 'New User Welcome',
                  description: 'Special rewards for referring new users to the platform',
                  startDate: '2025-01-01T00:00:00Z',
                  endDate: '2025-12-31T23:59:59Z',
                  bonusReward: 250,
                  referrerReward: 750,
                  refereeReward: 300,
                  isActive: true,
                },
              ],
            };
            
            set({
              campaigns: mockData.campaigns,
              isCampaignsLoading: false,
            });
          } catch (error) {
            set({ 
              isCampaignsLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch campaigns')
            });
          }
        },
        
        selectCampaign: async (campaignId: string) => {
          set({ isCampaignsLoading: true, error: null });
          
          try {
            // Find the campaign in the store
            const campaign = get().campaigns.find(c => c.id === campaignId);
            
            if (!campaign) {
              throw new Error('Campaign not found');
            }
            
            // In a real implementation, this would make an API call
            // const response = await apiClient.post(`/api/v1/referrals/campaigns/${campaignId}/link`);
            
            // Simulated response
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockData = {
              campaignReferralLink: `${window.location.origin}/join?ref=${get().referralCode}&campaign=${campaignId}`,
              campaignCode: get().referralCode,
            };
            
            set({
              selectedCampaign: campaign,
              campaignReferralLink: mockData.campaignReferralLink,
              isCampaignsLoading: false,
            });
          } catch (error) {
            set({ 
              isCampaignsLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to select campaign')
            });
          }
        },
        
        setTimeRange: (range) => {
          set({ timeRange: range });
          get().fetchStatistics(range);
        },
        
        checkReferralCode: async (code: string) => {
          try {
            // This would be replaced with actual API call
            // const response = await apiClient.get(`/api/v1/referrals/validate/${code}`);
            
            // Simulated validation
            return code.length >= 6;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error : new Error('Failed to validate referral code')
            });
            return false;
          }
        },
        
        resetError: () => set({ error: null }),
      }),
      {
        name: 'referral-storage',
        // Only persist minimal referral info
        partialize: (state) => ({ 
          referralCode: state.referralCode,
          referralLink: state.referralLink,
          isReferral: state.isReferral,
          referrerId: state.referrerId,
        }),
      }
    )
  )
);
