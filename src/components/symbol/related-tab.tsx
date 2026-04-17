'use client'

import { useState } from 'react'
import { Plus, Check, TrendingUp, TrendingDown } from 'lucide-react'
import type { RelatedAsset } from '@/types/symbol'

function fmt(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return `$${n.toLocaleString()}`
}

function CorrelationBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.8 ? '#26a69a' : value >= 0.6 ? '#f59e0b' : '#787b86'
  return (
    <div className="flex items-center gap-1">
      <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: '#2a2e39' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  )
}

interface AssetCardProps {
  asset: RelatedAsset
}

function AssetCard({ asset }: AssetCardProps) {
  const [inWatchlist, setInWatchlist] = useState(asset.inWatchlist)
  const isPos = asset.changePercent >= 0

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
      style={{ borderColor: '#2a2e39' }}
    >
      {/* Symbol badge */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
        style={{ background: 'rgba(41,98,255,0.12)', color: '#2962ff' }}
      >
        {asset.symbol.slice(0, 3)}
      </div>

      {/* Name + correlation */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium" style={{ color: '#d1d4dc' }}>{asset.symbol}</div>
        <div className="text-[11px] truncate" style={{ color: '#787b86' }}>{asset.name}</div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[9px] uppercase tracking-wide" style={{ color: '#4a4e58' }}>Corr:</span>
          <CorrelationBadge value={asset.correlation} />
        </div>
      </div>

      {/* Price + change */}
      <div className="text-right flex-shrink-0">
        <div className="text-[13px] font-medium tabular-nums" style={{ color: '#d1d4dc' }}>
          ${asset.price.toFixed(2)}
        </div>
        <div
          className="text-[11px] tabular-nums flex items-center gap-0.5 justify-end"
          style={{ color: isPos ? '#26a69a' : '#ef5350' }}
        >
          {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {isPos ? '+' : ''}{asset.changePercent.toFixed(2)}%
        </div>
        {asset.marketCap > 0 && (
          <div className="text-[10px]" style={{ color: '#787b86' }}>{fmt(asset.marketCap)}</div>
        )}
      </div>

      {/* Watchlist */}
      <button
        onClick={e => { e.stopPropagation(); setInWatchlist(v => !v) }}
        className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center transition-colors"
        style={
          inWatchlist
            ? { background: 'rgba(41,98,255,0.15)', color: '#2962ff' }
            : { background: '#2a2e39', color: '#787b86' }
        }
      >
        {inWatchlist ? <Check size={12} /> : <Plus size={12} />}
      </button>
    </div>
  )
}

interface Props {
  related: RelatedAsset[]
  symbol: string
}

export function RelatedTab({ related, symbol }: Props) {
  if (!related.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-[14px] font-medium" style={{ color: '#d1d4dc' }}>No related assets found</p>
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="text-[12px]" style={{ color: '#787b86' }}>
        Assets correlated with <span style={{ color: '#d1d4dc' }}>{symbol}</span> — sorted by correlation
      </div>
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#2a2e39', background: '#1e222d' }}>
        {related
          .sort((a, b) => b.correlation - a.correlation)
          .map(asset => (
            <AssetCard key={asset.symbol} asset={asset} />
          ))}
      </div>
    </div>
  )
}
