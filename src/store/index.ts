// TODO: Implement Zustand global store
import { create } from 'zustand';
import type { Profile, Watchlist, Alert, Tier } from '@/types';

interface AppState {
  profile: Profile | null;
  tier: Tier;
  watchlists: Watchlist[];
  alerts: Alert[];
  selectedSymbol: string | null;

  setProfile: (profile: Profile | null) => void;
  setWatchlists: (watchlists: Watchlist[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setSelectedSymbol: (symbol: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  tier: 'free',
  watchlists: [],
  alerts: [],
  selectedSymbol: null,

  setProfile: (profile) => set({ profile, tier: profile?.tier ?? 'free' }),
  setWatchlists: (watchlists) => set({ watchlists }),
  setAlerts: (alerts) => set({ alerts }),
  setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),
}));
