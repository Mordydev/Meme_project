import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiClient, AppError } from '@/lib/api-client';

/**
 * Referred user information
 */
export interface ReferredUser {
  userId: string;
  username: string;
  avatarUrl?: string;
  registeredAt: string;
  convertedAt?: string;
  status: 'pending' | 'active' | 'converted';
  pointsGenerated: number;
  lastActive?: string;
}

/**
 * Timeline data for referral analytics visualization
 */
export interface ReferralTimelineData {
  period: string; // time period label
  referrals: number;
  conversions: number;
  points: number;
}

/**
 * Campaign information
 */
export interface Campaign {
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

/**
 * Referral statistics overview
 */
export interface ReferralStatistics {
  totalReferrals: number;
  convertedReferrals: number;
  pendingReferrals: number;
  conversionRate: number;
  pointsEarned: number;
}

/**
 * Referral information
 */
interface ReferralStore {
  // Referral code and link
  referralCode: string;
  referralLink: string;
  qrCodeUrl?: string;
  
  // Statistics and analytics
  statistics: ReferralStatistics;
  timeline: ReferralTimelineData[];
  referrals: ReferredUser[];
  
  // Referral status
  isReferral: boolean;
  referrerId?: string;
  
  // Campaign data
  activeCampaigns: Campaign[];
  selectedCampaign: Campaign | null;
  campaignReferralLink?: string;
  
  // UI state
  isLoading: boolean;
  error: AppError | Error | null;
  
  // Actions
  fetchReferralInfo: () => Promise<void>;
  fetchReferralStatistics: (timeRange?: string) => Promise<void>;
  fetchReferredUsers: (status?: string, sortBy?: string, limit?: number, offset?: number) => Promise<void>;
  fetchActiveCampaigns: () => Promise<void>;
  selectCampaign: (campaignId: string | null) => Promise<void>;
  generateNewReferralCode: () => Promise<void>;
  validateReferralCode: (code: string) => Promise<boolean>;
  trackReferralShare: (channel: string) => Promise<void>;
  resetError: () => void;
}

/**
 * Zustand store for referral management
 */
export const useReferralStore = create<ReferralStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Default state
        referralCode: '',
        referralLink: '',
        qrCodeUrl: undefined,
        
        statistics: {
          totalReferrals: 0,
          convertedReferrals: 0,
          pendingReferrals: 0,
          conversionRate: 0,
          pointsEarned: 0
        },
        
        timeline: [],
        referrals: [],
        
        isReferral: false,
        referrerId: undefined,
        
        activeCampaigns: [],
        selectedCampaign: null,
        campaignReferralLink: undefined,
        
        isLoading: false,
        error: null,
        
        // Actions
        fetchReferralInfo: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiClient.get('/api/referrals/me');
            const { data } = response;
            
            if (data) {
              set({
                referralCode: data.referralCode,
                referralLink: data.referralLink,
                qrCodeUrl: data.qrCodeUrl,
                isReferral: data.isReferral,
                referrerId: data.referrerId,
                statistics: data.statistics,
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('Error fetching referral info:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch referral info')
            });
          }
        },
        
        fetchReferralStatistics: async (timeRange = 'all-time') => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiClient.get(`/api/referrals/analytics?timeRange=${timeRange}`);
            const { data } = response;
            
            if (data) {
              set({
                statistics: data.statistics,
                timeline: data.timeline,
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('Error fetching referral statistics:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch referral statistics')
            });
          }
        },
        
        fetchReferredUsers: async (status = 'all', sortBy = 'date', limit = 10, offset = 0) => {
          set({ isLoading: true, error: null });
          
          try {
            const queryParams = new URLSearchParams();
            if (status !== 'all') queryParams.append('status', status);
            queryParams.append('sortBy', sortBy);
            queryParams.append('limit', limit.toString());
            queryParams.append('offset', offset.toString());
            
            const response = await apiClient.get(`/api/referrals/users?${queryParams}`);
            const { data } = response;
            
            if (data) {
              set({
                referrals: data.referrals,
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('Error fetching referred users:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch referred users')
            });
          }
        },
        
        fetchActiveCampaigns: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiClient.get('/api/referrals/campaigns');
            const { data } = response;
            
            if (data) {
              set({
                activeCampaigns: data.campaigns,
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('Error fetching active campaigns:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch active campaigns')
            });
          }
        },
        
        selectCampaign: async (campaignId: string | null) => {
          set({ isLoading: true, error: null });
          
          try {
            if (!campaignId) {
              set({
                selectedCampaign: null,
                campaignReferralLink: undefined,
                isLoading: false,
              });
              return;
            }
            
            const { activeCampaigns } = get();
            const campaign = activeCampaigns.find(c => c.id === campaignId);
            
            if (!campaign) {
              throw new Error(`Campaign with ID ${campaignId} not found`);
            }
            
            const response = await apiClient.post(`/api/referrals/campaigns/${campaignId}/link`);
            const { data } = response;
            
            set({
              selectedCampaign: campaign,
              campaignReferralLink: data.campaignReferralLink,
              isLoading: false,
            });
          } catch (error) {
            console.error('Error selecting campaign:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to select campaign')
            });
          }
        },
        
        generateNewReferralCode: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiClient.post('/api/referrals/code');
            const { data } = response;
            
            if (data) {
              set({
                referralCode: data.referralCode,
                referralLink: data.referralLink,
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('Error generating new referral code:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to generate new referral code')
            });
          }
        },
        
        validateReferralCode: async (code: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiClient.get(`/api/referrals/validate/${code}`);
            const { data } = response;
            
            set({ isLoading: false });
            return data.isValid;
          } catch (error) {
            console.error('Error validating referral code:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to validate referral code')
            });
            return false;
          }
        },
        
        trackReferralShare: async (channel: string) => {
          try {
            await apiClient.post('/api/referrals/share', { channel });
          } catch (error) {
            console.error('Error tracking referral share:', error);
            // Don't set error state to avoid disrupting user flow
          }
        },
        
        resetError: () => set({ error: null }),
      }),
      {
        name: 'referral-storage',
        // Only persist non-sensitive data
        partialize: (state) => ({ 
          referralCode: state.referralCode,
          referralLink: state.referralLink,
          // Don't persist loading state or errors
        }),
      }
    )
  )
);
