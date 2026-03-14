export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          tier: 'free' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          tier?: 'free' | 'pro' | 'enterprise'
        }
        Update: {
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          tier?: 'free' | 'pro' | 'enterprise'
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: 'free' | 'pro' | 'enterprise'
          status: 'active' | 'canceled' | 'past_due' | 'trialing'
          cancel_at_period_end: boolean
          cancel_at: string | null
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          tier?: 'free' | 'pro' | 'enterprise'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          cancel_at_period_end?: boolean
          cancel_at?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
        }
        Update: {
          tier?: 'free' | 'pro' | 'enterprise'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          cancel_at_period_end?: boolean
          cancel_at?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          id: string
          user_id: string
          name: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          is_default?: boolean
        }
        Update: {
          name?: string
          is_default?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      watchlist_items: {
        Row: {
          id: string
          watchlist_id: string
          user_id: string
          symbol: string
          added_at: string
          notes: string | null
        }
        Insert: {
          watchlist_id: string
          user_id: string
          symbol: string
          notes?: string | null
        }
        Update: {
          notes?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          symbol: string
          condition: 'above' | 'below'
          target_price: number
          is_active: boolean
          triggered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          symbol: string
          condition: 'above' | 'below'
          target_price: number
          is_active?: boolean
        }
        Update: {
          is_active?: boolean
          triggered_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_positions: {
        Row: {
          id: string
          user_id: string
          symbol: string
          shares: number
          avg_price: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          symbol: string
          shares: number
          avg_price: number
          notes?: string | null
        }
        Update: {
          shares?: number
          avg_price?: number
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      community_ideas: {
        Row: {
          id: string
          user_id: string
          symbol: string
          exchange: string
          title: string
          description: string
          direction: 'long' | 'short' | 'neutral'
          timeframe: string
          tags: string[]
          likes: number
          views: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          symbol: string
          exchange?: string
          title: string
          description: string
          direction: 'long' | 'short' | 'neutral'
          timeframe: string
          tags?: string[]
          is_published?: boolean
        }
        Update: {
          title?: string
          description?: string
          direction?: 'long' | 'short' | 'neutral'
          timeframe?: string
          tags?: string[]
          likes?: number
          views?: number
          is_published?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      idea_comments: {
        Row: {
          id: string
          idea_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          idea_id: string
          user_id: string
          content: string
        }
        Update: {
          content?: string
        }
        Relationships: []
      }
      idea_likes: {
        Row: {
          id: string
          idea_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          idea_id: string
          user_id: string
        }
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
