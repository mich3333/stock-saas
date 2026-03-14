export type Tier = 'free' | 'pro' | 'enterprise';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  tier: Tier;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  tier: Tier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  cancel_at_period_end: boolean;
  cancel_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  items: WatchlistItem[];
  created_at: string;
  updated_at: string;
}

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  user_id: string;
  symbol: string;
  added_at: string;
  notes: string | null;
  quote?: QuoteData;
}

export interface Alert {
  id: string;
  user_id: string;
  symbol: string;
  condition: 'above' | 'below';
  target_price: number;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteData {
  symbol: string;
  shortName: string | null;
  regularMarketPrice: number | null;
  regularMarketChange: number | null;
  regularMarketChangePercent: number | null;
  regularMarketVolume: number | null;
  marketCap: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

export interface ChartPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const TIER_LIMITS: Record<Tier, { maxWatchlistStocks: number; maxWatchlists: number; alerts: boolean; apiAccess: boolean }> = {
  free: { maxWatchlistStocks: 5, maxWatchlists: 1, alerts: false, apiAccess: false },
  pro: { maxWatchlistStocks: Infinity, maxWatchlists: 10, alerts: true, apiAccess: false },
  enterprise: { maxWatchlistStocks: Infinity, maxWatchlists: Infinity, alerts: true, apiAccess: true },
};
