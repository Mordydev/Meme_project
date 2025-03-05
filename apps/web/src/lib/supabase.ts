import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for the entire app
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
  
  return user;
};

// Helper function to get user profile data
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
};

// Helper function to get user wallet connections
export const getUserWallets = async (userId: string) => {
  const { data, error } = await supabase
    .from('wallet_connections')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching user wallets:', error);
    return [];
  }
  
  return data;
};

// Helper function to get categories
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order_position', { ascending: true });
  
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  
  return data;
};

// Helper function to get posts
export const getPosts = async (categoryId?: string, limit = 10, offset = 0) => {
  let query = supabase
    .from('posts')
    .select(`
      *,
      users (id, username, display_name, avatar_url),
      categories (id, name, slug)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
  
  return data;
};

// Helper function to get a single post with comments
export const getPost = async (postId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      users (id, username, display_name, avatar_url),
      categories (id, name, slug),
      comments (
        *,
        users (id, username, display_name, avatar_url)
      )
    `)
    .eq('id', postId)
    .single();
  
  if (error) {
    console.error('Error fetching post:', error);
    return null;
  }
  
  return data;
};

// Helper function to get user achievements
export const getUserAchievements = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievements:achievement_id(*)
    `)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }
  
  return data;
};

// Helper function to get user points
export const getUserPoints = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user points:', error);
    return { total_points: 0 };
  }
  
  return data;
};

// Helper function to get latest market data
export const getLatestMarketData = async () => {
  const { data, error } = await supabase
    .from('market_snapshots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
  
  return data;
};

// Helper function to get user notifications
export const getUserNotifications = async (userId: string, limit = 10, offset = 0) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  
  return data;
};

export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  return data;
} 