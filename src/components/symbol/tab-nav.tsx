'use client'

import type { AssetType } from '@/types/symbol'

export type SymbolTab = 'overview' | 'news' | 'technicals' | 'forecasts' | 'related' | 'about'

const TAB_LABELS: Record<SymbolTab, string> = {
  overview: 'Overview',
  news: 'News',
  technicals: 'Technicals',
  forecasts: 'Forecasts',
  related: 'Related',
  about: 'About',
}

export function getTabsForAsset(type: AssetType): SymbolTab[] {
  if (type === 'stock' || type === 'etf') {
    return ['overview', 'news', 'technicals', 'forecasts', 'related', 'about']
  }

  return ['overview', 'news', 'technicals', 'related', 'about']
}

interface Props {
  active: SymbolTab
  onChange: (tab: SymbolTab) => void
  newsCount?: number
  tabs?: SymbolTab[]
}

export function TabNav({
  active,
  onChange,
  newsCount,
  tabs = ['overview', 'news', 'technicals', 'forecasts', 'related', 'about'],
}: Props) {
  return (
    <div className="flex items-center border-b overflow-x-auto" style={{ borderColor: '#2a2e39' }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className="relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors flex-shrink-0"
          style={{
            color: active === tab ? '#d1d4dc' : '#787b86',
            borderBottom: active === tab ? '2px solid #2962ff' : '2px solid transparent',
          }}
        >
          {TAB_LABELS[tab]}
          {tab === 'news' && newsCount !== undefined && newsCount > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(41,98,255,0.2)', color: '#2962ff' }}
            >
              {newsCount}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
