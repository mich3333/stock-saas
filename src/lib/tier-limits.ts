export const TIER_LIMITS = {
  free: { maxWatchlistItems: 5, maxWatchlists: 1, alerts: false, apiAccess: false, exportCsv: false },
  pro: { maxWatchlistItems: Infinity, maxWatchlists: 10, alerts: true, apiAccess: false, exportCsv: true },
  enterprise: { maxWatchlistItems: Infinity, maxWatchlists: Infinity, alerts: true, apiAccess: true, exportCsv: true },
} as const

export type SubscriptionTier = keyof typeof TIER_LIMITS

export function canAddToWatchlist(tier: SubscriptionTier, currentCount: number): boolean {
  return currentCount < TIER_LIMITS[tier].maxWatchlistItems
}

export function canCreateAlerts(tier: SubscriptionTier): boolean {
  return TIER_LIMITS[tier].alerts
}

export function canCreateWatchlist(tier: SubscriptionTier, currentCount: number): boolean {
  return currentCount < TIER_LIMITS[tier].maxWatchlists
}
