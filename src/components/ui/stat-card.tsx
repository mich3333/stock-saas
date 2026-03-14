'use client'
import { motion, useMotionValue, animate } from 'framer-motion'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { MiniSparkline } from '@/components/charts/mini-sparkline'

interface StatCardProps {
  title: string
  value: string
  change?: string
  isPositive?: boolean
  icon?: ReactNode
  delay?: number
  sparklineData?: number[]
  meta?: Array<{ label: string; value: string }>
}

function AnimatedNumber({ value, delay }: { value: string; delay: number }) {
  const numMatch = value.replace(/[,$%+ ]/g, '')
  const num = parseFloat(numMatch)
  const prefix = value.match(/^[^0-9-]*/)?.[0] ?? ''
  const suffix = value.replace(/^[^0-9-]*[\d,.-]+/, '')

  const [display, setDisplay] = useState(isNaN(num) ? value : prefix + '0' + suffix)
  const motionValue = useMotionValue(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (isNaN(num) || startedRef.current) return
    startedRef.current = true
    const timer = setTimeout(() => {
      const controls = animate(motionValue, num, {
        duration: 1.5,
        ease: 'easeOut',
        onUpdate: (v) => {
          const formatted = v >= 1000
            ? v.toLocaleString('en-US', { maximumFractionDigits: 2 })
            : v.toFixed(2)
          setDisplay(prefix + formatted + suffix)
        },
        onComplete: () => setDisplay(value),
      })
      return () => controls.stop()
    }, delay * 1000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <span>{display}</span>
}

export function StatCard({ title, value, change, isPositive, icon, delay = 0, sparklineData, meta }: StatCardProps) {
  const changeColor = isPositive ? 'var(--green)' : 'var(--red)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={{
        background: 'color-mix(in srgb, var(--panel-strong) 96%, white 4%)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: '1.5rem',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{title}</span>
        {icon && <span style={{ color: 'var(--accent)' }}>{icon}</span>}
      </div>
      {sparklineData && (
        <div style={{ marginBottom: '0.75rem' }}>
          <MiniSparkline data={sparklineData} positive={isPositive ?? true} height={40} />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>
          <AnimatedNumber value={value} delay={delay} />
        </span>
        {change && (
          <span style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.125rem', color: changeColor }}>
            {change}
          </span>
        )}
      </div>
      {meta && meta.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(meta.length, 3)}, minmax(0, 1fr))`, gap: '0.75rem', marginTop: '1rem' }}>
          {meta.map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--foreground)', fontWeight: 600 }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
