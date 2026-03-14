'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Spinner } from './spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', children, loading, disabled, ...props }, ref) => {
    const variants = {
      default: '',
      outline: '',
      ghost: '',
      destructive: '',
      success: '',
    }
    const variantStyles: Record<string, React.CSSProperties> = {
      default: {
        background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, white 30%))',
        color: '#fff',
        border: '1px solid color-mix(in srgb, var(--accent) 80%, white 20%)',
        boxShadow: '0 14px 32px color-mix(in srgb, var(--accent) 24%, transparent)',
      },
      outline: { border: '1px solid var(--border)', background: 'color-mix(in srgb, var(--panel) 70%, transparent)', color: 'var(--foreground)' },
      ghost: { background: 'transparent', color: 'var(--foreground)' },
      destructive: { background: 'var(--red)', color: '#fff' },
      success: { background: 'var(--green)', color: '#08111f' },
    }
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MotionButton = motion.button as any
    return (
      <MotionButton
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={disabled || loading}
        style={variantStyles[variant]}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </MotionButton>
    )
  }
)
Button.displayName = 'Button'
