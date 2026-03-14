import { cn } from '@/lib/utils'

const variantStyles: Record<string, React.CSSProperties> = {
  default: { background: '#2A2E39', color: '#D1D4DC' },
  success: { background: 'rgba(38,166,154,0.15)', color: '#26A69A' },
  danger: { background: 'rgba(239,83,80,0.15)', color: '#EF5350' },
  warning: { background: 'rgba(255,193,7,0.15)', color: '#FFC107' },
  info: { background: 'rgba(41,98,255,0.15)', color: '#2962FF' },
}

interface BadgeProps {
  children: React.ReactNode
  variant?: keyof typeof variantStyles
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', className)}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  )
}
