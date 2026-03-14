'use client'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react'
import { formatCurrency, formatPercent, formatLargeNumber } from '@/lib/utils'

interface StockCardProps {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number | null
  pe: number | null
  high52w: number
  low52w: number
  index?: number
  onAdd?: (symbol: string) => void
  inWatchlist?: boolean
}

export function StockCard({
  symbol,
  name,
  price,
  change,
  changePercent,
  volume,
  marketCap,
  pe,
  high52w,
  low52w,
  index = 0,
  onAdd,
  inWatchlist,
}: StockCardProps) {
  const isPositive = change >= 0
  const changeColor = isPositive ? 'var(--green)' : 'var(--red)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -2 }}
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '1.25rem',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{symbol}</span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: changeColor,
              }}
            >
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {formatPercent(changePercent)}
            </span>
          </div>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '0.125rem',
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--foreground)' }}>{formatCurrency(price)}</p>
          <p style={{ fontSize: '0.875rem', color: changeColor }}>
            {isPositive ? '+' : ''}
            {formatCurrency(change)}
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div>
          <span style={{ fontWeight: 500 }}>Vol:</span> {formatLargeNumber(volume)}
        </div>
        {marketCap && (
          <div>
            <span style={{ fontWeight: 500 }}>MCap:</span> {formatLargeNumber(marketCap)}
          </div>
        )}
        {pe && (
          <div>
            <span style={{ fontWeight: 500 }}>P/E:</span> {pe.toFixed(2)}
          </div>
        )}
        <div>
          <span style={{ fontWeight: 500 }}>52W:</span> {formatCurrency(low52w)} - {formatCurrency(high52w)}
        </div>
      </div>

      {onAdd && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAdd(symbol)
          }}
          style={{
            marginTop: '0.75rem',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            padding: '0.375rem 0',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
            background: inWatchlist ? 'rgba(239, 83, 80, 0.15)' : 'rgba(41, 98, 255, 0.15)',
            color: inWatchlist ? 'var(--red)' : 'var(--accent)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
        >
          {inWatchlist ? (
            <>
              <Minus size={12} /> Remove
            </>
          ) : (
            <>
              <Plus size={12} /> Watchlist
            </>
          )}
        </button>
      )}
    </motion.div>
  )
}
