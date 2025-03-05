export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon_url: string
          points: number
          difficulty: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon_url: string
          points: number
          difficulty: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon_url?: string
          points?: number
          difficulty?: string
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string
          slug: string
          order_position: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          slug: string
          order_position: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          slug?: string
          order_position?: number
          created_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          upvotes: number
          downvotes: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      market_snapshots: {
        Row: {
          id: string
          price: number
          volume_24h: number
          market_cap: number
          price_change_24h: number
          price_change_percentage_24h: number
          circulating_supply: number
          total_supply: number
          created_at: string
        }
        Insert: {
          id?: string
          price: number
          volume_24h: number
          market_cap: number
          price_change_24h: number
          price_change_percentage_24h: number
          circulating_supply: number
          total_supply: number
          created_at?: string
        }
        Update: {
          id?: string
          price?: number
          volume_24h?: number
          market_cap?: number
          price_change_24h?: number
          price_change_percentage_24h?: number
          circulating_supply?: number
          total_supply?: number
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          content: string
          reference_id: string | null
          reference_type: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          content: string
          reference_id?: string | null
          reference_type?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          content?: string
          reference_id?: string | null
          reference_type?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      posts: {
        Row: {
          id: string
          user_id: string
          category_id: string
          title: string
          content: string
          upvotes: number
          downvotes: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          title: string
          content: string
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          title?: string
          content?: string
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_points: {
        Row: {
          id: string
          user_id: string
          points: number
          action_type: string
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          points: number
          action_type: string
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          points?: number
          action_type?: string
          reference_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          email: string | null
          is_admin: boolean
          created_at: string
          updated_at: string | null
          last_login: string | null
          metadata: Json | null
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          email?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string | null
          last_login?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          email?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string | null
          last_login?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      wallet_connections: {
        Row: {
          id: string
          user_id: string
          address: string
          chain: string
          verified: boolean
          created_at: string
          last_verified: string | null
        }
        Insert: {
          id?: string
          user_id: string
          address: string
          chain: string
          verified?: boolean
          created_at?: string
          last_verified?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          address?: string
          chain?: string
          verified?: boolean
          created_at?: string
          last_verified?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_connections_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_total_points: {
        Args: {
          user_id_param: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface User {
  id: string;
  created_at: string;
  updated_at: string | null;
  clerk_id?: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  is_admin: boolean;
  is_verified?: boolean;
  last_seen_at?: string | null;
  last_login?: string | null;
  metadata?: any;
}

export interface WalletConnection {
  id: string;
  created_at: string;
  user_id: string;
  wallet_address: string;
  wallet_type: string;
  is_primary: boolean;
  is_verified: boolean;
  token_balance: number | null;
}

export interface Category {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  slug: string;
  order_position: number;
}

export interface Post {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  category_id: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  is_pinned: boolean;
  is_locked: boolean;
}

export interface Comment {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  post_id: string;
  parent_comment_id: string | null;
  content: string;
  upvotes: number;
  downvotes: number;
}

export interface UserPoints {
  id: string;
  created_at: string;
  user_id: string;
  total_points: number;
  points?: number;
  action_type?: string;
  reference_id?: string | null;
}

export interface Achievement {
  id: string;
  created_at: string;
  name: string;
  description: string;
  icon_url: string;
  points_value?: number;
  points?: number;
  difficulty: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | string;
}

export interface UserAchievement {
  id: string;
  created_at?: string;
  user_id: string;
  achievement_id: string;
  earned_at?: string;
  achievements?: Achievement;
}

export interface MarketSnapshot {
  id: string;
  created_at: string;
  price_usd: number;
  market_cap_usd: number | null;
  volume_24h_usd: number | null;
  percent_change_24h: number | null;
}

export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  related_id: string | null;
} 