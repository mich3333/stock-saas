import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Profile, Watchlist, Alert } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

export type Tier = 'free' | 'pro' | 'enterprise'

export interface StockQuoteCache {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number | null
  updatedAt: number
}

export type SortField = 'symbol' | 'price' | 'change' | 'changePercent' | 'volume' | 'marketCap'
export type SortDir = 'asc' | 'desc'

// ─── Profile / Auth slice ─────────────────────────────────────────────────────

interface ProfileSlice {
  profile: Profile | null
  tier: Tier
  setProfile: (profile: Profile | null) => void
}

// ─── Watchlist slice ──────────────────────────────────────────────────────────

interface WatchlistSlice {
  watchlists: Watchlist[]
  activeWatchlistId: string | null
  watchlistFilter: string
  watchlistSort: { field: SortField; dir: SortDir }
  setWatchlists: (watchlists: Watchlist[]) => void
  setActiveWatchlistId: (id: string | null) => void
  setWatchlistFilter: (filter: string) => void
  setWatchlistSort: (sort: { field: SortField; dir: SortDir }) => void
  addSymbolOptimistic: (watchlistId: string, symbol: string, itemId: string) => void
  removeSymbolOptimistic: (itemId: string) => void
}

// ─── Alerts slice ─────────────────────────────────────────────────────────────

interface AlertsSlice {
  alerts: Alert[]
  setAlerts: (alerts: Alert[]) => void
  addAlert: (alert: Alert) => void
  removeAlert: (id: string) => void
}

// ─── Stock quote cache slice ──────────────────────────────────────────────────

interface StockSlice {
  quotes: Record<string, StockQuoteCache>
  selectedSymbol: string | null
  setQuote: (symbol: string, data: Omit<StockQuoteCache, 'symbol' | 'updatedAt'>) => void
  setSelectedSymbol: (symbol: string | null) => void
}

// ─── UI slice ─────────────────────────────────────────────────────────────────

interface UISlice {
  sidebarOpen: boolean
  isDragMode: boolean
  theme: 'dark' | 'light'
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setIsDragMode: (v: boolean) => void
  setTheme: (theme: 'dark' | 'light') => void
}

// ─── Combined ────────────────────────────────────────────────────────────────

type AppState = ProfileSlice & WatchlistSlice & AlertsSlice & StockSlice & UISlice

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Profile
      profile: null,
      tier: 'free' as Tier,
      setProfile: (profile) => set({ profile, tier: (profile?.tier as Tier) ?? 'free' }),

      // Watchlists
      watchlists: [],
      activeWatchlistId: null,
      watchlistFilter: '',
      watchlistSort: { field: 'symbol', dir: 'asc' },
      setWatchlists: (watchlists) => set({ watchlists }),
      setActiveWatchlistId: (activeWatchlistId) => set({ activeWatchlistId }),
      setWatchlistFilter: (watchlistFilter) => set({ watchlistFilter }),
      setWatchlistSort: (watchlistSort) => set({ watchlistSort }),
      addSymbolOptimistic: (watchlistId, symbol, itemId) =>
        set((state) => ({
          watchlists: state.watchlists.map((wl) =>
            wl.id === watchlistId
              ? {
                  ...wl,
                  items: [
                    ...(wl.items ?? []),
                    { id: itemId, symbol, watchlist_id: watchlistId, user_id: '', added_at: new Date().toISOString(), notes: null },
                  ],
                }
              : wl
          ),
        })),
      removeSymbolOptimistic: (itemId) =>
        set((state) => ({
          watchlists: state.watchlists.map((wl) => ({
            ...wl,
            items: (wl.items ?? []).filter((i: { id: string }) => i.id !== itemId),
          })),
        })),

      // Alerts
      alerts: [],
      setAlerts: (alerts) => set({ alerts }),
      addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
      removeAlert: (id) => set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),

      // Stock quotes
      quotes: {},
      selectedSymbol: null,
      setQuote: (symbol, data) =>
        set((state) => ({
          quotes: { ...state.quotes, [symbol]: { symbol, ...data, updatedAt: Date.now() } },
        })),
      setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),

      // UI
      sidebarOpen: true,
      isDragMode: false,
      theme: 'dark',
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setIsDragMode: (isDragMode) => set({ isDragMode }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'stockflow-store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} })),
      // Only persist UI preferences and selected symbol — NOT sensitive data
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        selectedSymbol: state.selectedSymbol,
        watchlistSort: state.watchlistSort,
      }),
    }
  )
)

// Convenience selectors
export const useProfile = () => useAppStore((s) => s.profile)
export const useTier = () => useAppStore((s) => s.tier)
export const useWatchlists = () => useAppStore((s) => s.watchlists)
export const useAlerts = () => useAppStore((s) => s.alerts)
export const useSelectedSymbol = () => useAppStore((s) => s.selectedSymbol)
export const useTheme = () => useAppStore((s) => s.theme)
