'use client'
import { motion, useMotionValue, animate } from 'framer-motion'
import { cn } from '@/lib/utils'
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

export function StatCard({ title, value, change, isPositive, icon, delay = 0, sparklineData }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
        {icon && <span className="text-blue-500">{icon}</span>}
      </div>
      {sparklineData && (
        <div className="mb-3">
          <MiniSparkline data={sparklineData} isPositive={isPositive ?? true} width={120} height={40} />
        </div>
      )}
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          <AnimatedNumber value={value} delay={delay} />
        </span>
        {change && (
          <span className={cn('text-sm font-medium mb-0.5', isPositive ? 'text-green-500' : 'text-red-500')}>
            {change}
          </span>
        )}
      </div>
    </motion.div>
  )
}
