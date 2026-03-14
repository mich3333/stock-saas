'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const toastStyles: Record<ToastVariant, React.CSSProperties> = {
  success: { background: 'rgba(38,166,154,0.12)', border: '1px solid rgba(38,166,154,0.4)', color: '#26A69A' },
  error: { background: 'rgba(239,83,80,0.12)', border: '1px solid rgba(239,83,80,0.4)', color: '#EF5350' },
  warning: { background: 'rgba(255,193,7,0.12)', border: '1px solid rgba(255,193,7,0.4)', color: '#FFC107' },
  info: { background: 'rgba(41,98,255,0.12)', border: '1px solid rgba(41,98,255,0.4)', color: '#2962FF' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = icons[t.variant]
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 60, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={toastStyles[t.variant]}
                className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto max-w-sm"
              >
                <Icon size={18} className="flex-shrink-0" />
                <p className="text-sm font-medium flex-1">{t.message}</p>
                <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
