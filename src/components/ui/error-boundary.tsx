'use client'
import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, info: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info)
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-restricted-syntax
      console.error('[ErrorBoundary]', error, info)
    }
  }

  reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>
      return (
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-2xl p-8 text-center"
          style={{ background: '#1E222D', border: '1px solid #2A2E39', color: '#D1D4DC' }}
        >
          <AlertTriangle size={40} style={{ color: '#F7525F' }} />
          <div>
            <p className="text-base font-semibold mb-1">Something went wrong</p>
            <p className="text-sm" style={{ color: '#787B86' }}>
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
          </div>
          <button
            onClick={this.reset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: '#2962FF', color: '#fff' }}
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      )
    }
    return <>{this.props.children}</>
  }
}

/** Lightweight function wrapper for isolated error boundaries */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const Wrapped = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  Wrapped.displayName = `withErrorBoundary(${Component.displayName ?? Component.name})`
  return Wrapped
}
